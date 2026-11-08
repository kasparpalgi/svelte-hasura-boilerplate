> Run with: Opus 5.5 / high
> Machine: dell

# Deleting card on board shall delete todo task file too

## Original Requirement

[NEVER REMOVE]

Deleted: <https://github.com/kasparpalgi/svelte-hasura-boilerplate/blob/main/doc%2Ftodo%2F078-test.md> but file exists

_From Kanban card `e0255a90-21a6-4ec3-980c-4a6106d5d817`, moved to the agent list._

_GitHub issue #79 — end the commit subject with `(#79)`._

## Results

**Summary** — Deleting a card on the board now deletes its task file as well. The fix is in `svelte-todo-kanban` `fe75625`.

- **Cause:** `deleteTodo` in the todos store closed the card's GitHub issue but never touched the file at `task_file_path`. Card #78's draft `doc/todo/078-test.md` was left behind that way.
- **Fix:** after the row is deleted, the store calls a new `POST /api/github/delete-task-file` with the path and the board's repo. The card row is already gone by then, so the client sends these, the same way `delete-issue` does.
  - The endpoint only accepts `doc/todo/NNN-….md` or `.claude/todo/NNN-….md` paths.
  - It uses the user's own GitHub token and deletes in one commit through `commitTree`: `docs(todo): delete … with its card (#N)`.
- **What gets deleted:** `toDelete()` in `taskdir.ts` matches files by the card's stem. It removes the draft `NNN-slug.md`, the queued `NNN-slug-TODO.md` and its `NNN-slug.log`.
  - If a `-DONE.md` or `-BLOCKED.md` exists for that stem, nothing is deleted. Those are finished runs whose commits refer to them.
  - Matching by stem also covers a `task_file_path` in the database that is out of date, for example still `-TODO` after the runner renamed the file to `-DONE`.
- **Running tasks:** deleting a running `-TODO` card makes the #73 watcher stop the run, because the file is gone from origin.
- **This repo:** I deleted the orphan `doc/todo/078-test.md` left by the card that was already deleted.

**Files changed**
- `svelte-todo-kanban`:
  - created `src/routes/api/github/delete-task-file/+server.ts`
  - modified `src/lib/server/taskdir.ts` (`toDelete`, `dropTaskFiles`), `src/lib/stores/todos.svelte.ts` (the call in `deleteTodo`) and `src/lib/server/__tests__/taskdir.test.ts`
  - `package.json` 0.24.0 → 0.25.0
- This repo: deleted `doc/todo/078-test.md`, added this file, and bumped `package.json` 0.19.0 → 0.19.1.

**Verification**
- Kanban `npm run check`: 0 errors, 0 warnings.
- Kanban vitest (all projects): 383/383 pass, 4 of them new for `toDelete`. They cover:
  - deleting a draft
  - deleting a `-TODO` file together with its log
  - keeping everything once a `-DONE` or `-BLOCKED` exists
  - doing nothing when the file is already gone
- Not run: the kanban Playwright e2e. A local run overwrites the committed `playwright-report` (see kanban `c7c0256`).
- Not seen end to end yet: deleting a real card on the deployed board. The first one will show a `docs(todo): delete … with its card` commit in the repo.

**Deviations**
- `-DONE.md` and `-BLOCKED.md` files are kept on purpose: they are the prompt history of shipped work. If you want those deleted too, change one line in `toDelete`.
