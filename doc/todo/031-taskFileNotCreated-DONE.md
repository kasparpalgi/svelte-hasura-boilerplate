In 'svelte-todo-kanban' repo 's board at todoxx.eu moved card #163 to TODO list but not even the markdown file got created in that repo. At least that was working before 030 todo task was done. See logs if there is any if something at all happened when I moved it to TODO list. In Herdr didn't check immediatelly but like few minutes later and no sessions.
---

## Results

**Summary**

Card #163 "Drag'n'drop crap" (todo `951ba857…`) *was* in the agent list and the endpoint
*was* called. It returned `{ skipped: 'already a TODO file' }` and wrote nothing.

The chain, from the live DB and the repo's git history:

1. `.claude/todo/160-dragNDropCrap-TODO.md` was created for this card at 12:21 and
   **deleted at 21:07:52** (commit `20490bb`, "Delete .claude/todo/160-dragNDropCrap-TODO.md").
2. The card's `task_file_path` was still `.claude/todo/160-dragNDropCrap-TODO.md`.
   Nothing anywhere clears that column — not the delete, not the runner's `-DONE` rename.
3. The card was moved to TODO at 21:11:35. `write-task-file` saw a path ending in
   `-TODO.md`, concluded "already a TODO file", and returned early **without checking
   whether the file still existed**. No file, no card comment, no runner work, no herdr
   session — all correct downstream behaviour on a file that was never written.

**Why there were no logs at all:** the endpoint's only instrumentation is
`loggingStore.*`, and `loggingStore.log()` opens with `if (!browser) return;`. Every
call from a `+server.ts` has always been a no-op. Seven GitHub endpoints were logging
into the void.

Unrelated to 030 — 030 only touched `klarity-claude-kit`. The trigger was the manual
delete of the task file, which is new behaviour, not a regression.

**Also found and fixed:** `findTaskFileRenames` in the push webhook hardcoded `doc/todo/`,
so a `-TODO → -DONE` rename inside `.claude/todo/` never matched and never moved the card
to Review. That is why card #161 "Errors" still sits in TODO although
`.claude/todo/157-errors-DONE.md` was pushed.

**Files changed** — all in `svelte-todo-kanban` (commit `d78f913`):

- created `src/lib/server/log.ts` — `serverLog.info/warn/error` to stdout/stderr
- modified `src/routes/api/github/write-task-file/+server.ts` — `fileExists()` gate before
  reusing `task_file_path`; warns and writes a fresh file when the path is stale
- modified `src/lib/server/taskfile.ts` — `findTaskFileRenames()` moved here, matches
  `doc/todo` **and** `.claude/todo` (it could not stay exported from a `+server.ts`)
- modified `src/routes/api/github/webhook/+server.ts` — imports it instead
- modified 6 further `api/github/*/+server.ts` — `loggingStore` → `serverLog`
- modified `src/lib/server/__tests__/taskfile.test.ts` — 3 tests for the rename matcher
- modified `package.json` — 0.13.0 → 0.13.1

**Live data repair:** cleared `task_file_path` on card `951ba857-ccf1-4cfa-9e97-cb85420071a0`
so #163 works against the *currently deployed* build too. Drag it out of TODO and back and
it will write `.claude/todo/163-dragNDropCrap-TODO.md`.

**Verification**

- `npm run test:unit:server` — 155 passed (12 files), including the 3 new ones
- `npm run check` — 9 errors, 4 warnings, all pre-existing (og-image `Buffer` typing and
  two store test fixtures); none in any touched file
- Diagnosis verified against the live Hasura endpoint, not inferred: card row, board
  `agent_list_id`, and the repo's git history for the deleted file

**Deviations**

- The fix lives in `svelte-todo-kanban`, not this repo — this repo only holds the prompt
  history. Same shape as task 030.
- `task_file_path` is still never cleared on `-DONE`; the existence check makes that
  harmless rather than fixing the root data model. Worth a follow-up only if a case
  appears where the check is not enough.
