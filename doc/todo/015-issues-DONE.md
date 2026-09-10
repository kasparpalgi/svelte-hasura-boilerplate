> Run with: Opus 5 / high

# Issues

## Original Requirement

[NEVER REMOVE]

See why it gets stuck often so I have to manually pull and then push again:

diverged from origin/main (pull --ff-only failed)
09:39:27 skip kasparpalgi/svelte-todo-kanban — main has diverged from origin/main (pull --ff-only failed)
09:39:58 skip kasparpalgi/svelte-todo-kanban — main has diverged from origin/main (pull --ff-only failed)
09:40:26 skip kasparpalgi/svelte-todo-kanban — main has diverged from origin/main (pull --ff-only failed)
09:40:55 skip kasparpalgi/svelte-todo-kanban — main has diverged from origin/main (pull --ff-only failed)
09:41:24 skip kasparpalgi/svelte-todo-kanban — main has diverged from origin/main (pull --ff-only failed)
09:41:53 skip kasparpalgi/svelte-todo-kanban — main has diverged from origin/main (pull --ff-only failed)
09:42:22 skip kasparpalgi/svelte-todo-kanban — main has diverged from origin/main (pull --ff-only failed)

Also, in this repo 013 was completed but left to "Doing" list and no comment with results. Investigate also why that sometimes happens but not always.

_From Kanban card `96985b49-ea39-4a7f-a02b-774798ab7f41`._

_GitHub issue #15 — end the commit subject with `(#15)`._

## Results

**Summary** — Both symptoms were one runner bug each, in `klarity-claude-kit`.

*1. Stuck on "diverged from origin/main".* `preflight` ran `git pull --ff-only` and, on
failure, returned a skip — forever. Nothing in the runner ever resolved a divergence, so
every later tick hit the same wall until a human pulled by hand: **2616 such skips in one
`kanban-runner.log`** for `svelte-todo-kanban` alone. The divergence itself is routine and
self-inflicted: the runner makes local `chore(todo): checkpoint…` / `docs(todo): finish…`
commits while the Kanban's `write-task-file` API pushes `docs(todo): … from Kanban` commits
straight to origin — both sides move, `--ff-only` dies. `preflight` now falls back to
`git pull --rebase` (the tree is clean and everything local is unpushed by that point, so
this is exactly the pull the human was doing); only a genuine content conflict still skips,
and it `rebase --abort`s first so the tree is never left mid-rebase.

*2. Task 013 finished but its card stayed in "Doing" with no comment.* The agent committed
`013-…-DONE.md` but committed only the *added* side of the rename — the deletion of
`013-…-TODO.md` stayed uncommitted. `run.js` treats **any** leftover dirt as "ran but did
not finish": it parked that deletion in a stash (resurrecting the `-TODO` file) and
returned early, skipping the push, `reportToIssue` and `closeLoop` entirely. That is the
"sometimes but not always" — it only bites when a run ends dirty; task 014, which ended
clean, closed its card and issue normally. `run.js` now commits dirt that is confined to
the task folder — the run's own bookkeeping, and exactly what `preflight` would commit on
the next tick anyway — and only parks dirt outside it, which really is abandoned work.

Stranded 013 state was also repaired: the parked stash was popped (removing the duplicate
`-TODO` file), and `closeLoop` was replayed for task 013 — issue #13 is commented and
closed, and its card moved to Review with the Results.

**Files changed** — `klarity-claude-kit`:

- `plugins/dev-kit/runner/src/repo.js` — new `commitTaskDir()` helper (shared with
  `preflight`); `pull --rebase` fallback with `rebase --abort` on conflict, new
  `kind: "diverged"`
- `plugins/dev-kit/runner/src/run.js` — commit task-folder-only dirt instead of parking it;
  re-read `HEAD` after that commit so the push and follow-up diff include it
- `plugins/dev-kit/runner/test/repo.test.js` — 3 new tests (half-committed rename;
  rebase past a divergence and push; unrebasable divergence still skips with a clean tree)
- `plugins/dev-kit/runner/package.json` → 0.10.6, `.claude-plugin/plugin.json` → 0.12.6

`svelte-hasura-boilerplate`: removed the resurrected `doc/todo/013-tooManyCommitsDue-TODO.md`.

**Verification** — `node --test test/*.test.js`: **33/33 pass** (was 30). The two new
`preflight` tests build a real bare origin plus a second clone, so the rebase and the
conflict path are exercised against actual git, not a mock. `closeLoop` replay for 013
printed `issue #13 commented and closed` / `card → Review, results posted`.

**Deviations** — None. No boilerplate app code was touched; both issues lived in the runner.
