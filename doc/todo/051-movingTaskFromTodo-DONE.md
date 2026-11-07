> Run with: Opus 5.5 / high
> Machine: mac

# Moving task from TODO list away shall rename it

## Original Requirement

[NEVER REMOVE]

Remove from it the TODO from file name

_From Kanban card `f45a5b62-9bc2-49c5-befe-139a10c3033d`._

_GitHub issue #51 — end the commit subject with `(#51)`._

## Results

**Summary** — The fix belongs in `svelte-todo-kanban` (commit `a52af32`, v0.22.0). Every card move already
calls `POST /api/github/write-task-file`. Before this change it did nothing unless the card landed in the
board's `agent_list_id` list. Now, when a card moves to any other list and its `task_file_path` still ends
in `-TODO.md`, the server renames `NNN-slug-TODO.md` → `NNN-slug.md` in one Git-data-API commit
(`docs(todo): … back to draft (#NNN)`), points the card at the draft, and comments
"Task file back to draft: …". Moving the card back into TODO uses the existing draft → `-TODO` path, so
the round trip works. `-DONE`/`-BLOCKED` files are left alone. The draft keeps its
`_From Kanban card_` line, so the runner's follow-up sweep (`followup.js`, which skips files that carry a
card id) won't file it as a new Backlog card.

**Files changed** (svelte-todo-kanban)
- created `src/lib/server/unqueue.ts` — `unqueue()` + `draftPathFor()`
- modified `src/routes/api/github/write-task-file/+server.ts` — calls `unqueue` on the non-agent-list branch
- modified `src/lib/stores/todos.svelte.ts` — comment only
- modified `src/routes/api/github/__tests__/write-task-file.test.ts` — 2 new tests (rename to draft; `-DONE` untouched)
- `package.json` 0.21.1 → 0.22.0
- here: this task file only

**Verification**
- `npm run check` — 0 errors, 0 warnings
- `vitest --project=server` — 292/292 pass
- `vitest --project=client` — could not run on this Mac: Playwright's Chromium headless shell isn't
  installed. It fails the same way with this change stashed, so it's not caused by this change.
- No live browser test. It deploys to Vercel on push; to check it in production, drag a TODO card to
  Backlog and look for the "back to draft" commit.

**Deviations** — None. One known edge case: if someone drags a card out of TODO while a runner is already
running that task, the file on `main` is renamed mid-run, and the agent's own `-DONE` rename may conflict
on pull. The runner never moves cards itself (only to Review, server-side, after the file is `-DONE`), so
only a manual drag can trigger this.
