Now when session ends it leaves open the terminal but doesnt take the next task. Basically I can atm move to TODO in Kanban as much as I want but won't start anymore. Then typed into finished terminal /exit on phone and it closed it but still new sessions won't start.

## Results

**Summary** — Root cause found and fixed in the `klarity-claude-kit` dev-kit runner
(this repo is the cross-repo task hub; no source here changed except this file).

The open terminal was a red herring. The real wedge: a run that finishes **without
committing its work leaves the tree dirty**, and `preflight` blocks a repo on *any* dirt.
So the repo — and every card moved to TODO in it afterward — was skipped on every tick,
forever. The runner made the mess (its own agent run) and then refused to move past it.

Concretely: task `167-archiveBoards` ran in `svelte-todo-kanban`, the agent did ~458 lines
of work across 11 files plus a new migration and test, but never committed or renamed to
`-DONE`. The session ended, the pane was left open (the task-008 behaviour), and from then
on the runner logged `skip … dirty working tree` every ~20s and never picked anything up.
`ezyspace-landing` was wedged the same way. `cooldownUntil` was 0 and the daemon was alive
and ticking the whole time — it just skipped past the dirt.

**The fix** — after a run, the runner parks its *own* leftover in a stash so the tree goes
clean and the queue keeps moving; the work is recoverable with `git stash pop`. `parkDirty`
only ever runs immediately after the runner's agent run, so it touches the runner's dirt,
never a human editing the tree.

- `runner/src/repo.js` — new `parkDirty(cwd, filename)`: `git stash push -u` when the tree
  is dirty, returns the stash label (or null).
- `runner/src/run.js` — call it on both post-run exit paths (`exit ≠ 0`, and the
  exit-0-but-did-not-finish branch); the notifications now say the work was parked.
- `runner/test/repo.test.js` — 3 new tests (stashes leftover / no-op on clean / pop
  recovers). Suite 25 → 28, all pass.
- `runner/package.json` 0.10.2 → 0.10.3, `.claude-plugin/plugin.json` 0.12.2 → 0.12.3.

**Live recovery** — the code fix prevents *future* wedges but can't clear dirt that was
already there (the blocked task can't run to trigger the cleanup). So the existing wedge was
cleared by hand, non-destructively:
- `svelte-todo-kanban` → `git stash` (`stash@{0}`, label "runner wedge recovery (task-012)");
  `git stash pop` there restores task-167's work.
- `ezyspace-landing` → already clean by then (nothing to stash).

Within ~15s of clearing the dirt the running daemon picked up `134-pushNotifications-TODO.md`
and started a session — the queue is moving again.

**Verification**
- `node --check src/run.js src/repo.js` — clean.
- `node --test test/*.test.js` — **28/28 pass**.
- Live: runner resumed and started the next task (`svelte-todo-kanban 134-…`, 07:54:30).

**Action for the human**
- **Restart Herdr / the runner daemon** to load 0.10.3 — the running daemon still holds the
  pre-fix code (started before this change), so it won't self-heal the *next* dirty finish
  until restarted.
- `git stash pop` in `svelte-todo-kanban` if you want task-167's archiveBoards work back.

**Deviations** — Also hardened the `exit ≠ 0` (stuck) path, not just the reproduced exit-0
case, since a stuck run leaving dirt wedges a repo the same way. Did not touch `preflight`:
auto-recovering dirt there would sweep up a human's in-progress edits — parking only the
runner's own just-produced output is the safe, targeted place.