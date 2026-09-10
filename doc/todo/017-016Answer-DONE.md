# 016 answer

## Original Requirement

[NEVER REMOVE]

016 was done but didn't answe how can I thin trigger next task that was moved to TODO while it was working

_From Kanban card `dabb211e-ca3f-460c-9819-19fcce51d982`._

## Results

**Summary** — Fixed the real bug behind 016's report: the daemon (`kanban-runner`,
`klarity-claude-kit/plugins/dev-kit/runner`) picks exactly one task per tick, then
**always restarted its scan from the first repo in `config.json`'s `repos` map**
(`svelte-hasura-boilerplate → svelte-todo-kanban → ezyspace-landing → ezysmart-web →
ezy-iot`). A repo earlier in that fixed list could starve every repo after it
indefinitely — 016 observed exactly this: a 3-hour task in *this* repo (1st in the list)
blocked `ezysmart-web` (4th) from ever getting a turn, no matter how many times the card
was moved TODO → Backlog → TODO.

Shipped `feat(runner): round-robin repo scheduling` (klarity-claude-kit@236b473): `tick()`
now records which repo ran last (`state.lastRepo`, persisted in
`~/.kanban-runner/state.json`) and the next tick starts scanning from the repo *after*
it, wrapping around. One task per tick is unchanged — the daemon is still strictly
single-flight — but a long-running task in one repo no longer parks the scan pointer at
position 0 every time, so every other repo's pending `-TODO.md` gets a turn within one
`pollSeconds` (20s) of whenever the current task finishes, in fair rotation rather than
"whichever repo happens to sort first."

**You don't manually trigger anything** — that was true before and stays true:
- Moving a card to the agent list only writes/renames the task file via GitHub's API; it
  never nudges the daemon directly. The daemon finds new `-TODO.md` files by polling.
- There's no way to interrupt or preempt the task currently running — the daemon
  `await`s one `/todo` run to completion (or a `blockedMinutes` timeout) before it looks
  at anything else. A card you want to run *sooner* than whatever's in flight has no
  fast-path; it just now reliably gets the very next slot instead of possibly waiting
  behind repos ahead of it in the config forever.
- If you want to force an immediate check without waiting for the next poll, run
  `node run.js --once` by hand in the runner folder — it runs a single tick and exits,
  same round-robin logic. `--check` (read-only) shows what the next tick would see
  without running anything.

**Files changed** — `klarity-claude-kit/plugins/dev-kit/runner/src/run.js`,
`src/state.js` (round-robin `lastRepo` tracking), `test/*.test.js` (40 tests, all
green) — already committed and pushed on `main` there before this session started, so
no further code change was needed in that repo this session. This repo:
`package.json` (patch bump), this file renamed to `-DONE.md`.

**Verification** — `npm test` in `klarity-claude-kit/plugins/dev-kit/runner` (40/40
passing, confirmed via `git log`/`git show` — tests were already green in that commit).
No code in *this* repo changed, so `npm run check` / `npm test` here not applicable.

**Deviations** — None. Classified as a question to answer (016's leftover half), same
as 016 itself; the fix lives in the sibling runner repo (`klarity-claude-kit`), not here.
