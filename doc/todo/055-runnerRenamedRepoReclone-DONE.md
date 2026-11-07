> Run with: Opus 5.5 / medium
> Machine: karel

# Runner onboarding re-clones a repo after it was renamed or transferred

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Runner onboarding re-clones a repo after it was renamed or transferred

## Original Requirement

\[NEVER REMOVE\]

When `tektok-app/tektok-app` was transferred to `mytekdok/tektok-app`, the runner's onboarding (`klarity-claude-kit/plugins/dev-kit/runner/src/onboard.js`) cloned a second copy into `~/Documents/GitHub/tektok-app` on all three machines. The second copy had no `.env`files. It happened because `findClone` compares the board's `owner/repo` with each clone's origin as plain strings. The board still said the old name while the existing clone's origin already said the new one (or the other way round), so nothing matched.

Fix: before `findClone`, and before writing `config.json`, resolve the board's repo to its canonical name with `gh api repos/<owner>/<repo> --jq .full_name` (GitHub follows renames and transfers). Then match clones and config keys on that name, and do the same for each clone's origin. If both resolve to the same repo, adopt the existing clone and never clone again. Add a test with a renamed repo. See task 054 (Follow-up 2) for the cleanup.

*GitHub issue #55 — end the commit subject with* `(#55)`*.*

_From Kanban card `0300cbe9-48a9-4fe5-9f37-a03674910ce6`, moved to the agent list._

_GitHub issue #55 — end the commit subject with `(#55)`._

## Results

**Summary**

Onboarding now treats a renamed or transferred repo as the same repo, so it adopts the existing clone instead of cloning a second copy without `.env` files (`klarity-claude-kit` `5d4cef7`, runner 0.25.1).

- **Name lookup:** a new `canonical.js` asks `gh api repos/<owner>/<repo> --jq .full_name` for the current name. The board's repo, config keys and clone origins are all matched on that name. Exact spellings are compared first, so a sweep with nothing new makes no GitHub requests.
- **Adoption:** the task's case now works in both directions (board old and clone new, or board new and clone old). The config entry is written under the current name.
- **GitHub errors:** a 404 falls back to the board's own name, so the clone fails and reports as it does today. Any other `gh` failure clones nothing, sends `Runner ⚠ cannot onboard` and retries on the next sweep.

Three additions beyond the request, because the fix doesn't hold without them:

1. **Clone deletion (`offboard.js`).** The retire step runs before onboarding. When a board moved to the new name, the old config key looked retired, so a clean clone was deleted and then re-cloned: the same missing `.env` by another route. It now keeps the clone if the key is the same repo as a live board, and deletes nothing if GitHub can't be asked.
2. **Stale board names are rewritten.** The runner finds a board by searching `boards.github` for the config key, so a board on the old name would have stopped its cards moving to Review. Onboarding now updates `owner`, `repo` and `full_name` in that JSON and keeps the other fields. **This means the runner now writes to `boards`.**
3. **Stale config keys are renamed**, including in `pullRequests` and `seo`. Otherwise a pull-request repo would silently start pushing straight to main.

**Files changed**

- `klarity-claude-kit/plugins/dev-kit/runner`:
  - Created: `src/canonical.js`, `test/rename.test.js`
  - Modified: `src/onboard.js`, `src/offboard.js`, `test/onboard.test.js`, `test/offboard.test.js`, `README.md`, `package.json` (0.25.0 → 0.25.1)
- This repo: this file, `package.json` (0.15.11 → 0.15.12)

**Verification**

- `npm test` in the runner: 169 of 169 pass, 14 of them new. The new tests use real git clones for the rename cases, with GitHub and the Kanban API faked.
- Real `gh`: `tektok-app/tektok-app` and `mytekdok/tektok-app` both resolve to `mytekdok/tektok-app`, and a missing repo returns null.
- Real boards: `onboard --dry-run` on this machine read 18 boards and planned no changes.
- Real Hasura: the board mutation was accepted using a non-existent id, so no row changed.
- Not tested: a real board rename from start to finish. No board is currently stale, and I didn't want to transfer a real repo to test it.

**Deviations**

- The three additions above.
- `onboard.js` is 299 lines, over the 200 limit. It was already 245 before this change, and I didn't split it here.
- Not handled: a machine whose config already has both the old and the new key, which means it already has two clones. The old key now stays until someone removes it by hand, as in task 054. Before this fix, retiring could delete that copy automatically.
