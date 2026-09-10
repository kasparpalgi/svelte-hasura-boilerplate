> Run with: Sonnet 4.6 / medium

# Too many commits due autosave

## Original Requirement

[NEVER REMOVE]

Due to autosave when I type like 3-4min the card there will be 20+ commits or so. Don't sync that often and maybe also merge later the commits to not spam.

_From Kanban card `9380fd2c-e08d-455a-8a56-62ca82027fbc`._

_GitHub issue #13 — end the commit subject with `(#13)`._

## Results

**Summary** — Added a `checkpointQuietSeconds` (default: 60s) quiet period to the runner. `preflight` now checks the mtime of every dirty task file before making a checkpoint commit; if any file was modified within the last 60 seconds it returns `{ settling: true }` and the tick silently skips instead of committing. A 3-minute typing session with `pollSeconds: 20` previously produced ~9 checkpoint commits; now it produces one, after the user stops typing for 60 seconds.

**Files changed** — `klarity-claude-kit`:
- `plugins/dev-kit/runner/src/repo.js` — `statSync` import; `quietSeconds` param on `preflight`; settling check before checkpoint commit
- `plugins/dev-kit/runner/src/run.js` — pass `cfg.checkpointQuietSeconds` to `preflight`; handle `settling: true` return
- `plugins/dev-kit/runner/src/config.js` — `checkpointQuietSeconds` config key (default 60)
- `plugins/dev-kit/runner/config.example.json` — document the new key
- `plugins/dev-kit/runner/package.json` — bumped to 0.10.5
- `plugins/dev-kit/.claude-plugin/plugin.json` — bumped to 0.12.5

**Verification** — `node --test test/*.test.js`: 30/30 pass

**Deviations** — "merge later the commits" (squash) was skipped; the quiet period prevents new spam without rewriting history. Existing checkpoint commits in git history are unaffected.
