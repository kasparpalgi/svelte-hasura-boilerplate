> Run with: Opus 4.8 / medium

# Wrong model

## Original Requirement

[NEVER REMOVE]

This card was from dropdown selected at the Kanban board Opus 5 but picked Sonnet 5
/Users/klarity/Documents/ezy/ezysmart-web/.claude/todo/012-addMoreLoggingTo-TODO.md

Note: it is still running - do not break it

_From Kanban card `3b410f70-e526-433e-8985-1bf22dd46d4e`._

_GitHub issue #2 — end the commit subject with `(#2)`._

---

## Results

**Summary** — Root-caused and fixed the "chose Opus, ran Sonnet" bug. The bug is in the
Kanban product (`svelte-todo-kanban`), not this boilerplate. A draft task file is written at
card creation (`write-draft-file` → `buildDraftFile`), usually **before** the model dropdown
is touched, so it has no `> Run with:` line. When the card later reaches the agent list,
`renameDraftToTodo` in `write-task-file` kept that frozen draft body and only appended footers
via `ensureFooter` — it never reconciled the model line with the card's now-set `agent_model`.
So a card whose dropdown read "Opus 5" shipped a task file with no model line, the runner fell
back to auto, and the classifier picked Sonnet. The ezysmart-012 evidence matches exactly: no
`> Run with:` line and no "moved to the agent list" text (draft body preserved verbatim).

Fix: new pure helper `ensureRunWith(body, card)` injects/overwrites the `> Run with:` line
from the card's `agent_model`/`agent_effort` field; wired into the draft-rename path. An auto
card (no field) is left untouched so the runner's classifier still decides.

**Files changed** (all in `svelte-todo-kanban`, commit `c3f4df3`, pushed to main):

- Modified `src/lib/server/taskfile.ts` — added exported `ensureRunWith`.
- Modified `src/routes/api/github/write-task-file/+server.ts` — call `ensureRunWith` before
  `ensureFooter` in `renameDraftToTodo`.
- Modified `src/lib/server/__tests__/taskfile.test.ts` — 3 unit tests.
- Modified `src/routes/api/github/__tests__/write-task-file.test.ts` — 1 route regression test.

**Verification**

- Unit + route tests: 52 passing (4 new).
- `npm run check`: touched files clean; the 9 pre-existing `svelte-check` errors are all in
  unrelated files (charts, filters sidebar, og-image endpoints, store tests) and untouched.

**Deviations** — The fix landed in `svelte-todo-kanban` (where the bug lives), not this repo,
so the commit subject there does **not** carry `(#2)` (that issue is in this boilerplate); the
kanban commit body references it in prose instead. Confirmed with the user before pushing to
that live product's `main`. The referenced ezysmart-012 run was only read, never touched.
