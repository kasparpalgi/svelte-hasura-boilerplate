/** Turn a Kanban card into `doc/todo/NNN-name-TODO.md` in the target repo. */

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** "Fix the login redirect" -> "fixTheLoginRedirect" */
export function camelName(title) {
	const words = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.split(' ')
		.filter(Boolean)
		.slice(0, 4);
	if (!words.length) return 'kanbanTask';
	return (
		words[0] +
		words
			.slice(1)
			.map((w) => w[0].toUpperCase() + w.slice(1))
			.join('')
	);
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

/**
 * The Kanban's editor stores card bodies as HTML; task files are markdown. Plain-text
 * cards (voice input, pasted checklists) contain no tags and pass through untouched.
 */
export function toText(content) {
	if (!content || !/<[a-z/]/i.test(content)) return (content ?? '').trim();
	return content
		.replace(/<li\b[^>]*>/gi, '\n- ')
		.replace(/<(br|\/p|\/h[1-6]|\/ul|\/ol|\/div)\b[^>]*>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&([a-z]+|#\d+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m)
		.replace(/[ \t]+$/gm, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** Highest NNN already in the folder, plus one. */
export function nextNumber(dir) {
	const used = readdirSync(dir)
		.map((f) => Number.parseInt(f.slice(0, 3), 10))
		.filter((n) => Number.isInteger(n));
	return String(Math.max(0, ...used) + 1).padStart(3, '0');
}

export function writeTaskFile(repoPath, card, runWith) {
	const dir = join(repoPath, 'doc', 'todo');
	mkdirSync(dir, { recursive: true });

	const number = nextNumber(dir);
	const filename = `${number}-${camelName(card.title)}-TODO.md`;
	const body = [
		`> Run with: ${runWith.label}`,
		'',
		`# ${card.title}`,
		'',
		'## Original Requirement',
		'',
		'[NEVER REMOVE]',
		'',
		toText(card.content) || '_(no description on the card)_',
		'',
		`_From Kanban card \`${card.id}\`, moved to TODO._`,
		''
	].join('\n');

	writeFileSync(join(dir, filename), body);
	return { number, filename };
}
