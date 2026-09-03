/** Decide which model + effort a card should run with. */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const TIERS = {
	opus: { model: 'opus', effort: 'high', label: 'Opus 5 / high' },
	sonnet: { model: 'sonnet', effort: 'medium', label: 'Sonnet 5 / medium' },
	haiku: { model: 'haiku', effort: 'low', label: 'Haiku 4.5 / low' }
};

const PROMPT = `Classify this development task by how much model it needs.
Answer with exactly one word, nothing else:
opus - hard architecture, multi-system design, security-sensitive work
sonnet - a normal feature, refactor or bugfix
haiku - a mechanical edit: rename, copy change, config tweak

Task:
`;

/** The card may say it outright: "Run with: Opus 5 / high" or just "opus". */
export function explicitTier(text) {
	const named = /run with:\s*(opus|sonnet|haiku)/i.exec(text || '');
	return named ? TIERS[named[1].toLowerCase()] : null;
}

/** Otherwise ask the cheapest model. Falls back to sonnet on any trouble. */
export async function classify(text) {
	const explicit = explicitTier(text);
	if (explicit) return explicit;

	try {
		const { stdout } = await run('claude', ['-p', PROMPT + text, '--model', 'haiku'], {
			timeout: 60_000
		});
		const word = /\b(opus|sonnet|haiku)\b/i.exec(stdout);
		if (word) return TIERS[word[1].toLowerCase()];
	} catch {
		// classifier is a nicety, never a blocker
	}
	return TIERS.sonnet;
}
