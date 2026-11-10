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
