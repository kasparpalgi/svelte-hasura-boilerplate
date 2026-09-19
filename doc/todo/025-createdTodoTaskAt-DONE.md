> Run with: Opus 5 / high

# Created todo task at tekdok-app repo

## Original Requirement

[NEVER REMOVE]

But it didn't trigger and in logs I see:

01:54:52 tick failed: spawn git ENOENT 01:55:12 tick failed: spawn git ENOENT 01:55:32 tick failed: spawn git ENOENT 01:55:52 tick failed: spawn git ENOENT 01:56:12 tick failed: spawn git ENOENT 01:56:32 tick failed: spawn git ENOENT 01:56:52 tick failed: spawn git ENOENT 01:57:12 tick failed: spawn git ENOENT 01:57:32 tick failed: spawn git ENOENT 01:57:52 tick failed: spawn git ENOENT

_From Kanban card `d6997547-2eef-47ef-a35f-0ee227395c94`._

_GitHub issue #25 — end the commit subject with `(#25)`._

## Results

**Summary** — The `spawn git ENOENT` error was caused by a typo in `config.json`: the `tektok-app/tektok-app` repo path was set to `~/Documents/GitHub/customers/tekdok-app` (with 'd') but the actual directory is `~/Documents/GitHub/customers/tektok-app` (with 't'). Node's `execFile("git", ..., { cwd })` throws ENOENT when the cwd doesn't exist, and the error message misleadingly says "spawn git ENOENT" as if git itself is missing. Fixed the typo and added a directory-existence check to `preflight()` so missing repos are skipped gracefully instead of crashing the entire tick.

**Files changed** — (in `klarity-claude-kit`)
- `plugins/dev-kit/runner/config.json` — fixed typo `tekdok-app` → `tektok-app` (gitignored, local only)
- `plugins/dev-kit/runner/src/repo.js` — added `existsSync(cwd)` guard at the top of `preflight()`
- `plugins/dev-kit/runner/package.json` — bumped 0.14.0 → 0.14.1

**Verification** — Runner restarted, ENOENT gone, picked up and started running tekdok-app task `002-500ErrorStillAfter-TODO.md`

**Deviations** — None
