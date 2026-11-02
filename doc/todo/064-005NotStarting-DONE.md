> Run with: Opus 5.5 / high
> Machine: dell

# 005 not starting

## Original Requirement

[NEVER REMOVE]

Why ostutark_v2 repo 005 in todo column not starting on karel2 win?

_From Kanban card `45ff9012-8fd7-41b4-802b-a6ac400c0b8d`, moved to the agent list._

_GitHub issue #64 — end the commit subject with `(#64)`._

## Results

**Summary** — The Windows runner was healthy. Card 005 never got a task file. You moved cards
004 and 005 into TODO two seconds apart (11:54:55 and 11:54:57 UTC). The Kanban turned 004's
draft into `004-…-TODO.md`. 005's rename lost the race: `commitTree` read `main`, built its
commit, and then 004's commit landed first. GitHub refused the ref update, and the card's
comments show it: `Could not write the task file … (422) "Update is not a fast forward"`.
So 005 stayed a suffixless draft, `005-designTheOfflineData.md`. The runner only runs
`-TODO.md` files, so it never saw it. Two fixes:

1. **Now:** I published the draft by hand, the same way `write-task-file` does: the card's
   current text, plus the `Run with` / `Machine: windows` / issue lines. It went into
   `doc/todo/005-designTheOfflineData-TODO.md`, ostutark_v2 `3193fe9`. I also updated the card's
   `task_file_path` and added a "Task file ready" comment. The WSL runner started it at 15:45:38
   (`▶ kasparpalgi/ostutark_v2 005-designTheOfflineData-TODO.md (Opus 5.5 / high, attempt 1)`).
2. **For good:** in svelte-todo-kanban `64c7b90` (0.21.1), `commitTree` now rebuilds the commit
   on the new head and tries again (up to 3 tries) when the ref update is "not a fast forward".
   It rethrows any other error. This also covers the archive commit that `makeRoom` makes.
   Vercel deploy: success.

Side note: the "no Review list" line in the 004 run log is already resolved. You created the
Review list at 13:39 UTC, after that run had finished.

**Files changed**
- svelte-todo-kanban: `src/lib/server/taskdir.ts`, `src/lib/server/__tests__/taskdir.test.ts`,
  `package.json` / `package-lock.json` (0.21.1).
- ostutark_v2: `doc/todo/005-designTheOfflineData.md` → `005-designTheOfflineData-TODO.md`.
- Hasura: card `cc79739c…` `task_file_path` and one comment.
- This repo: this task file.

**Verification**
- Kanban: there are 2 new `commitTree` tests (retries after a lost race; does not retry a 403).
  The vitest server project passes 290/290. `npm run check` gives 0 errors and 0 warnings, and
  eslint is clean on the changed files.
- WSL runner journal: 005 started at 15:45:38.

**Deviations** — None. This repo's `package.json` is not bumped, because no code changed here.
