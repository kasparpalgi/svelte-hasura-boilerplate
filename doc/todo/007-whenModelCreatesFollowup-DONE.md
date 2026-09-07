# When model creates followup issues it doesn't create cards in Backlog

## Original Requirement

[NEVER REMOVE]

Not sure if you directly create a card via Hasura API then does it create GitHub issue and assign it? Probably rather not so that you must check from svelte-todo-kanban repo how to do that.

_From Kanban card `741f7443-42b9-4931-86af-59fd53b71321`._

_GitHub issue #7 — end the commit subject with `(#7)`._

---

## Results

**Summary** — Researched `klarity-claude-kit` (the `dev-kit` runner). Answer: no code
change was needed — this was already fixed, before this card was even filed.

**The question, answered:** inserting a `todos` row directly via the Hasura API does
**not** create or assign a GitHub issue. There is no Hasura event trigger on `todos` in
`svelte-todo-kanban` (`hasura/metadata` has no `event_triggers`). Issue creation only
happens client-side, in `TodosStore.addTodo` (`src/lib/stores/todos.svelte.ts`), as an
explicit second step: insert the row via `CREATE_TODO`, then — only if the "create GitHub
issue" checkbox was on — `POST /api/github/create-issue`, which calls the GitHub API and
writes `github_issue_number`/`github_issue_id`/`github_url` back onto the row. A bare
insert skips all of that, exactly as guessed.

**The actual concern — does the model's own follow-up filing create Backlog cards? Yes,**
as of `klarity-claude-kit@c578e8d` ("feat(runner): close the Kanban card when a task
finishes", 2026-09-06 22:06, i.e. *before* this card was filed at 16:38 the next day).
The runner (`plugins/dev-kit/runner/src/run.js`) no longer polls Hasura for TODO cards —
it drives entirely off local `doc/todo/*-TODO.md` files (`queue.js`) and, once a task
file ends `-DONE`/`-BLOCKED`, calls `closeLoop()` in `kanban.js`. That function:
- moves the originating card to Review and posts the agent's `## Results` as a comment
  (`MOVE`/`SAY`), and closes the linked GitHub issue via `gh` (`issue.js`) — only when
  the file names one (`_GitHub issue #N`), never inferred from the filename;
- via `fileFollowUps()`, scans the files the run *added* (`git diff --diff-filter=A`)
  for any bare `NNN-*.md` with no `_From Kanban card …` line of its own (`FOLLOW_UP`
  regex, deliberately excluding `-TODO`/`-DONE`/`-BLOCKED`) — i.e. exactly the plain
  files this skill's step 2 ("split it into new numbered task files") produces — and
  inserts one Backlog card per file via `NEW_CARD`, with `task_file_path` set and no
  GitHub issue attached (matching the answer above: follow-ups get a card, not an
  issue, unless a person later syncs one from the UI).
- it's idempotent (`EXISTING` query skips paths that already have a card) and covered
  by 13 passing tests in `plugins/dev-kit/runner/test/kanban.test.js`
  (`npm test` in that dir — all green).

So the gap the card describes doesn't exist in the current runner. Nothing to build; no
split-off task files needed.

**Files changed** — none (research only; `package.json` version left unchanged since no
functional or doc content changed here beyond this Results section).

**Verification**
- `cd ~/Documents/GitHub/klarity-claude-kit/plugins/dev-kit/runner && npm test` → 13/13
  pass, including follow-up-filing and card-id-matching tests.
- Confirmed no `event_triggers` in `svelte-todo-kanban/hasura/metadata`.
- Confirmed `fileFollowUps()` predates this card by commit timestamp.

**Deviations** — None; this was a research/question task, no split into new task files
was warranted since the underlying capability already exists and is tested.
