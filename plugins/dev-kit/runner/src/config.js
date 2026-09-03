/** Config is one JSON file plus one env var for the secret. */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PATH = join(dirname(dirname(fileURLToPath(import.meta.url))), 'config.json');

const expand = (dir) => resolve(dir.startsWith('~/') ? join(homedir(), dir.slice(2)) : dir);

export function loadConfig(path = process.env.KANBAN_RUNNER_CONFIG ?? DEFAULT_PATH) {
	const file = JSON.parse(readFileSync(path, 'utf8'));
	const adminSecret = process.env.HASURA_ADMIN_SECRET;
	if (!adminSecret) throw new Error('HASURA_ADMIN_SECRET is not set');
	if (!file.endpoint) throw new Error(`${path}: "endpoint" is required`);

	return {
		endpoint: file.endpoint,
		adminSecret,
		pollSeconds: file.pollSeconds ?? 20,
		lists: { todo: 'TODO', doing: 'Doing', review: 'Review', blocked: 'Blocked', ...file.lists },
		repos: Object.fromEntries(
			Object.entries(file.repos ?? {}).map(([name, dir]) => [name, expand(dir)])
		)
	};
}
