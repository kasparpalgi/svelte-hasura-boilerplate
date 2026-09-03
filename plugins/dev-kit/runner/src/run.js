#!/usr/bin/env node
/**
 * Kanban runner: watch the TODO column, run `/todo NNN` in the matching repo.
 *
 * Outbound-only — polls Hasura, so it needs no public endpoint, tunnel or webhook secret.
 * One card at a time: that is the queue, and it keeps git out of trouble.
 */

import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { loadConfig } from './config.js';
import { CLAIM, PENDING, REPORT, makeClient } from './hasura.js';
import { classify } from './classify.js';
import { writeTaskFile } from './taskfile.js';

const cfg = loadConfig();
const gql = makeClient(cfg.endpoint, cfg.adminSecret);
const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);

/** `{owner, repo, full_name}` on the board, mapped to a local clone via config. */
function repoPathFor(board) {
	const github = typeof board.github === 'string' ? JSON.parse(board.github) : board.github;
	const fullName = github?.full_name ?? (github ? `${github.owner}/${github.repo}` : null);
	return fullName ? [fullName, cfg.repos[fullName] ?? null] : [null, null];
}

const listId = (board, name) => board.lists.find((l) => l.name === name)?.id ?? null;

/** `%(owner/a|owner/b)%` — the SIMILAR TO pattern that keeps the query to our own boards. */
const reposPattern = `%(${Object.keys(cfg.repos).join('|')})%`;

/** One card per tick: a column can hold 90 cards, and each one spawns a Claude session. */
const pending = (limit) => gql(PENDING, { list: cfg.lists.todo, repos: reposPattern, limit });

function shell(command, args, cwd) {
	return new Promise((resolve) => {
		const child = spawn(command, args, { cwd, env: process.env });
		let output = '';
		const collect = (chunk) => {
			output += chunk;
			process.stdout.write(chunk);
		};
		child.stdout.on('data', collect);
		child.stderr.on('data', collect);
		child.on('close', (code) => resolve({ code, output }));
		child.on('error', (err) => resolve({ code: 1, output: String(err) }));
	});
}

const tail = (text, lines = 30) => text.trim().split('\n').slice(-lines).join('\n');

const exec = promisify(execFile);

async function head(cwd) {
	try {
		const { stdout } = await exec('git', ['rev-parse', '--short', 'HEAD'], { cwd });
		return stdout.trim();
	} catch {
		return null;
	}
}

async function report(card, list, comment) {
	if (!list) return log('  ! no target column configured, card left in Doing');
	await gql(REPORT, { id: card.id, list, userId: card.user_id, comment });
}

async function runCard(card) {
	const board = card.list.board;
	const [fullName, repoPath] = repoPathFor(board);
	if (!repoPath) return log(`skip "${card.title}" — no local repo mapped for ${fullName}`);

	const doing = listId(board, cfg.lists.doing);
	if (!doing) return log(`skip "${card.title}" — board has no "${cfg.lists.doing}" column`);

	const claim = await gql(CLAIM, { id: card.id, from: card.list_id, to: doing });
	if (claim.update_todos.affected_rows === 0) return;

	try {
		const tier = await classify(`${card.title}\n\n${card.content ?? ''}`);
		const { number, filename } = writeTaskFile(repoPath, card, tier);
		log(`▶ ${fullName} ${filename} (${tier.label})`);

		const before = await head(repoPath);
		const { code, output } = await shell(
			'claude',
			[
				'-p',
				`/todo ${number}`,
				'--model',
				tier.model,
				'--effort',
				tier.effort,
				'--dangerously-skip-permissions'
			],
			repoPath
		);
		const after = await head(repoPath);

		if (code === 0) {
			// Repos whose CLAUDE.md forbids committing leave HEAD untouched — say so honestly.
			const at = after && after !== before ? `committed as \`${after}\`` : 'uncommitted';
			const list = listId(board, cfg.lists.review);
			await report(card, list, `\`doc/todo/${filename}\` — ${tier.label}, ${at}.`);
			log(`✔ ${filename}`);
		} else {
			const list = listId(board, cfg.lists.blocked);
			await report(
				card,
				list,
				`\`/todo ${number}\` exited ${code}.\n\n\`\`\`\n${tail(output)}\n\`\`\``
			);
			log(`✘ ${filename} exit ${code}`);
		}
	} catch (err) {
		await report(card, listId(board, cfg.lists.blocked), `Runner error: ${err.message}`);
		log(`✘ "${card.title}": ${err.message}`);
	}
}

async function tick() {
	const { todos } = await pending(1);
	for (const card of todos) await runCard(card);
}

const CHECK_LIMIT = 10;

/** `--check`: prove the config reaches Hasura and lands on real repos, run nothing. */
async function check() {
	const { todos } = await pending(CHECK_LIMIT);
	log(`up to ${CHECK_LIMIT} of the card(s) in "${cfg.lists.todo}":`);
	for (const card of todos) {
		const board = card.list.board;
		const [fullName, repoPath] = repoPathFor(board);
		const missing = Object.values(cfg.lists).filter((name) => !listId(board, name));
		log(`  "${card.title}" → ${repoPath ?? `UNMAPPED (${fullName ?? 'no repo on board'})`}`);
		if (missing.length) log(`    missing column(s): ${missing.join(', ')}`);
	}
}

if (!Object.keys(cfg.repos).length) throw new Error('config: "repos" is empty — nothing to watch');

if (process.argv.includes('--check')) {
	await check();
} else {
	log(`watching "${cfg.lists.todo}" on ${cfg.endpoint} every ${cfg.pollSeconds}s`);
	for (;;) {
		await tick().catch((err) => log('poll failed:', err.message));
		await new Promise((r) => setTimeout(r, cfg.pollSeconds * 1000));
	}
}
