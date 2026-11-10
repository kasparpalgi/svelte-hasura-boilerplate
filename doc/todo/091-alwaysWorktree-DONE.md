> Run with: Opus 5.5 / xhigh

# Run every task in a worktree, not only pull-request repos

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# Run every task in a worktree, not only pull-request repos

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

Dirty-tree stalls (005, 026, 046, 060) all start in the main checkout. Pull-request repos already run each task in its own worktree (`worktree.js`). Do the same for push-to-main repos: run in a worktree on the base branch, then fast-forward and push from there, so the main checkout is never touched by an agent. Keep the guards in the README's guard table true, or update them.

Acceptance: a run that leaves its tree dirty no longer blocks the next task in that repo.

---

\--&gt;&gt;&gt;&gt; important: make sure always also clean up worktrees and whatever created and not needed anymore cache etc

*GitHub issue #91 — end the commit subject with* `(#91)`*.*

_From Kanban card `5b8adbd9-b7df-4e47-9f28-8645450663e2`, moved to the agent list._

_GitHub issue #91 — end the commit subject with `(#91)`._

## Results

**Summary** — Every task now runs in its own worktree, not only in pull-request repos. No
agent touches the main checkout any more, so a run that ends dirty, on another branch or
half-rebased no longer blocks the next task in that repo. The work is in
`klarity-claude-kit` (runner 0.31.0, dev-kit 0.25.0):

- **Push-to-main repos** run in `~/.kanban-runner/worktrees/<repo>/<stem>` on a
  `run/<stem>` branch. It is made from the clone's HEAD and tracks `origin/main`, so the
  agent's `git pull` works as usual. When the session ends the runner:
  - commits dirt that is only in the task folder, and parks any other dirt in a stash
    (stashes are shared, so `git stash pop` from the clone still recovers it);
  - pushes unpushed commits to `main` from the worktree, rebasing onto `origin/main` if
    it moved (three tries, because the Kanban pushes all day);
  - removes the worktree and its branch, and fast-forwards the clone.

  Commits on a branch the session made itself (its CLAUDE.md asked for one) are pushed
  to that branch with **↗ task on a branch**, never to `main`. Work that won't rebase
  stays in its worktree with **✘ did not land**, and the next attempt carries on there.
- **The `/todo` skill** tells an agent on a `run/<NNN>-<slug>` branch to push with
  `git push origin HEAD:main`. An older plugin that still runs `git push origin main`
  pushes nothing of its own, and the runner lands its commits anyway.
- **Cleanup**, as asked:
  - Each worktree, `node_modules` included, is removed when its run ends.
  - A sweep each tick puts away any worktree left behind: a pane that was still
    running, a usage-limit retry whose card moved, a runner restart. A push repo's tree
    is landed first; a PR repo's tree goes only when it is clean and fully on origin.
  - The local `run/`/`todo/` branch is deleted once it is all on origin. At each runner
    start, older branches like that are dropped too (this machine has 17 `todo/*` ones in
    tektok-app).
  - Empty repo folders go, and so do trust entries in `~/.claude.json` for worktrees
    that no longer exist (183 on this machine).
  - The clone's gitignored `.claude/settings.local.json` is copied into each worktree, so
    permissions and MCP approvals match the clone.
- `--check` lists open runner worktrees. The README covers it all under *Every task in
  its own worktree*, with new guard-table rows, and `doc/how-it-works.md` marks #91 built.

**Files changed**

- `klarity-claude-kit` — created `runner/src/land.js`, `runner/src/sweep.js` and
  `runner/test/land.test.js`. Modified `runner/src/run.js`, `worktree.js`, `trust.js`,
  `config.js`, `runner/test/trust.test.js`, `worktree.test.js`, `runner/README.md`,
  `runner/package.json`, `skills/todo/SKILL.md` and `.claude-plugin/plugin.json`.
- this repo — modified `doc/how-it-works.md` and `package.json` (0.19.8); this task file
  renamed to `-DONE`.

**Verification**

- Runner `npm test`: 225/225 pass. 13 tests are new: landing, rebasing over a moving
  origin, a session that pushed by itself, a rebase conflict, a session on its own
  branch, catch-up, the sweep in both repo types, branch pruning and trust pruning.
- `claude plugin validate ./plugins/dev-kit`: passed.
- End-to-end smoke run of `run.js --once` with a fake `claude` against a scratch repo:
  - commit without push → landed and finished ✔;
  - only dirt → ⚠ parked twice, then skipped, **and the next task still ran**;
  - only a rename → committed and landed ✔;
  - a finished worktree left behind → the sweep landed it, the next tick pulled it.

  The clone was clean on `main` after every tick, with no worktrees, `run/` branches or
  trust entries left behind.
- `prettier --check doc/how-it-works.md`: clean. The app code is unchanged, so
  `npm run check` and `npm test` weren't needed here.

**Deviations**

- Push repos now pay `npm ci` per task, as PR repos already did (seconds to a few
  minutes, logged). Hard-linking the clone's `node_modules` could be a follow-up if it
  hurts.
- Claude's own transcripts for each worktree stay in `~/.claude/projects/`. They are the
  full session record (#90 wants them), and Claude Code deletes them after 30 days. Old
  stashes stay too, because they are the recovery copy.
- A worktree that the sweep finds on a branch the session made itself is pushed there,
  but it doesn't mark the task skipped the way an end-of-run does. That only happens for
  a left-behind pane in a branch-per-task repo.
