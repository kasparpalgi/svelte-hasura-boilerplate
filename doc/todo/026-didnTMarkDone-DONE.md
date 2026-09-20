> Run with: Sonnet 4.6 / high

# Didn't mark done in kanban

## Original Requirement

[NEVER REMOVE]

See why and fix - 'tekdok-app' repo task #007 was successfully and renamed DONE but in Kanban board not moved to "Review" list - remained in "TODO" list (maybe because there was no Review list but now is but I have noticed same issue before too). Also, follow-up #008 task was created as a Markdown file, but in kanban board into backlog card was not created.

_From Kanban card `d7eb28d8-1604-48ff-91b9-56dcf91a647d`._

_GitHub issue #26 — end the commit subject with `(#26)`._

## Results

**Summary** — Fixed the runner so that when the Kanban "Review" list doesn't exist, the card still gets its Results posted as a comment and its `task_file_path` updated to the DONE file. Previously, a missing Review list silently skipped both — leaving the card in TODO with no trace of completion. Added a `SET_PATH` mutation for path-only updates (no list move) and restructured `closeLoop` to always post the Results comment regardless of list availability.

**Root cause of Bug 2** — The Backlog list was also missing on the newly-created board. The existing code already logged `no "Backlog" list — N follow-up(s) unfiled` and surfaced it in the phone notification; no code change needed there.

**Files changed**
- `plugins/dev-kit/runner/src/kanban.js` — added `SET_PATH` mutation; refactored move+comment block to decouple path update and comment from list move
- `plugins/dev-kit/runner/package.json` — bumped to 0.14.2

**Verification** — `npm test` in runner dir: 57/57 pass

**Deviations** — None

**Manual action needed** — Card `d7eb28d8-1604-48ff-91b9-56dcf91a647d` (tekdok-app #007) is still in the TODO list on the board. Move it to Review manually — the runner won't re-process a DONE file.
