> Run with: Opus 5.5 / medium
> Machine: karel

# Runner deletes a task's worktree while its session is still running

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Runner deletes a task's worktree while its session is still running

## Original Requirement

\[NEVER REMOVE\]

Found on Karel while a runner session was executing `mytekdok/tektok-app#252-detectOutsidePlatformCta`: the task's worktree (`~/.kanban-runner/worktrees/tektok-app/252-detectOutsidePlatformCta`) disappeared mid-session, with no uncommitted work lost only because the session had not written any files yet. The journal (`journalctl --user -u kanban-runner.service`) shows why:

```
23:09:16  stuck in herdr: Command failed: herdr agent wait task-252 --until working --until idle --until done --timeout 1799503
23:09:16  {"error":{"code":"timeout","message":"timed out waiting for agent status"}}
23:09:18  ✘ 252-detectOutsidePlatformCta-TODO.md exit 1 — nothing on its branch
23:10:13  skip mytekdok/tektok-app — 252-detectOutsidePlatformCta-TODO.md is still running in its pane
          (…repeats every ~minute for the next 50 minutes, because the pane really was still alive)
```

The session had been claimed at 22:38 and was still doing legitimate work past the 23:09 mark — reading files, then waiting on three rounds of `AskUserQuestion` to clarify a vague task — when `runInHerdr`'s own wait (`taskMinutes`, 30 minutes) ran out. `runInHerdr`(`plugins/dev-kit/runner/src/herdr.js:215-233`) has no way to tell "the agent is still genuinely working/blocked-on-the-user" apart from "it crashed or is wedged": both the real `agent_status === "blocked"` case and a herdr CLI/wait error land in the same `{ code: 1, ... }`return. `src/run.js` then folds that into an `exit <code>` failure string and hands it to `finishPrRun` (`src/run.js:587-653`), which unconditionally calls `closeWorktree(repoPath, cwd)` on the failed path (`src/run.js:625`, `:648`) — deleting the worktree the live pane is still sitting in.

The guard that would have caught this already exists, just one tick too late: `runRepo`(`src/run.js:286`) checks `paneLive(task-<number>)` before *re-claiming* a task, which is why every subsequent tick logged "still running in its pane" instead of starting a second session — but by then the worktree was already gone.

Fix: before `finishPrRun` treats a non-zero `code` as a finished run, check `paneLive` for that task's pane (same helper `run.js:286` already uses). If the pane is still live, treat this tick as "still running" — log it and return, same as the existing re-claim guard — instead of closing the worktree and notifying failure. Only actually finish (close the worktree, mark failed) once the pane is gone or has been idle at an empty shell prompt (herdr's own signal that the session ended). Also consider: `runInHerdr`'s catch block (`herdr.js:231-234`) could distinguish a wait-timeout (`err.message` matching herdr's `timeout` error code) from a real crash, and pass that through instead of collapsing both to the same `{ code: 1 }`, so `run.js` doesn't even need to re-derive it from pane liveness alone. Add a test that a `paneLive` task past `taskMs` is left alone, not closed.

*GitHub issue #60 — end the commit subject with* `(#60)`*.*

_From Kanban card `17f4fbb3-789f-4b62-8677-7defc2e9bbc4`, moved to the agent list._

## Results

**Summary** — Fixed in `kasparpalgi/klarity-claude-kit` commit `7453aa7` (runner 0.23.1). `runInHerdr` now returns `live` on a non-zero exit: `true` when the agent is still blocked, and on a herdr wait error/timeout it is the result of `paneLive(name)` (working or blocked). Right after the run loop, `run.js` checks it. If `code && live`, it logs "still running in its pane, left alone", gives back the attempt (`addTry -1`) and returns — the same as the re-claim guard. It does not ship, park, notify failure or `closeWorktree`. A later tick re-picks the task once the pane has ended, and `openWorktree` reuses the worktree that was left in place.

**Files changed** (klarity-claude-kit) — modified `plugins/dev-kit/runner/src/herdr.js`, `src/run.js`, `test/herdr.test.js`, `package.json` (0.23.0 → 0.23.1). Here: this task file only.

**Verification** — runner `npm test`: 144/144 pass, including 2 new tests: a pane still `working` after the prompt wait times out reports `live: true`; a wait failure with the pane gone reports `live: false`. `node --check src/run.js` is OK. The `run.js` branch has no direct test: `run.js` is the daemon entry and has no test harness.

**Deviations** — The guard is placed before both finishing paths (PR worktree and direct clone), not only before `finishPrRun`, because the direct path would otherwise `git stash` a live session's work. Liveness is decided from `paneLive` instead of parsing herdr's `timeout` error code, because it covers every wait error. That Results note was wrong: the next run's clock never finds the earlier transcript, so its usage would have been lost entirely.

**Follow-up (same day)** — A session that is left alone is now remembered in memory (`leftAlone` in `run.js`). Before each repo's tick, `recordLeftAlone` records that session's usage once `paneLive` says its pane has ended, using the original run's start time. This is in klarity-claude-kit, runner 0.23.2. The runner's tests pass (144/144). Limitation: the map is in memory only, so a daemon restart while such a session is running still loses that session's usage.
