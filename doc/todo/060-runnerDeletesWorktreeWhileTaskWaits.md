> Run with: Sonnet 5.5 / medium

# Runner deletes a task's worktree while its session is still running

## Original Requirement

[NEVER REMOVE]

Found on Karel while a runner session was executing `mytekdok/tektok-app#252-detectOutsidePlatformCta`:
the task's worktree (`~/.kanban-runner/worktrees/tektok-app/252-detectOutsidePlatformCta`)
disappeared mid-session, with no uncommitted work lost only because the session had not written
any files yet. The journal (`journalctl --user -u kanban-runner.service`) shows why:

```
23:09:16  stuck in herdr: Command failed: herdr agent wait task-252 --until working --until idle --until done --timeout 1799503
23:09:16  {"error":{"code":"timeout","message":"timed out waiting for agent status"}}
23:09:18  ✘ 252-detectOutsidePlatformCta-TODO.md exit 1 — nothing on its branch
23:10:13  skip mytekdok/tektok-app — 252-detectOutsidePlatformCta-TODO.md is still running in its pane
          (…repeats every ~minute for the next 50 minutes, because the pane really was still alive)
```

The session had been claimed at 22:38 and was still doing legitimate work past the 23:09 mark —
reading files, then waiting on three rounds of `AskUserQuestion` to clarify a vague task — when
`runInHerdr`'s own wait (`taskMinutes`, 30 minutes) ran out. `runInHerdr`
(`plugins/dev-kit/runner/src/herdr.js:215-233`) has no way to tell "the agent is still genuinely
working/blocked-on-the-user" apart from "it crashed or is wedged": both the real
`agent_status === "blocked"` case and a herdr CLI/wait error land in the same `{ code: 1, ... }`
return. `src/run.js` then folds that into an `exit <code>` failure string and hands it to
`finishPrRun` (`src/run.js:587-653`), which unconditionally calls `closeWorktree(repoPath, cwd)` on
the failed path (`src/run.js:625`, `:648`) — deleting the worktree the live pane is still sitting in.

The guard that would have caught this already exists, just one tick too late: `runRepo`
(`src/run.js:286`) checks `paneLive(task-<number>)` before _re-claiming_ a task, which is
why every subsequent tick logged "still running in its pane" instead of starting a second session
— but by then the worktree was already gone.

Fix: before `finishPrRun` treats a non-zero `code` as a finished run, check `paneLive` for that
task's pane (same helper `run.js:286` already uses). If the pane is still live, treat this tick as
"still running" — log it and return, same as the existing re-claim guard — instead of closing the
worktree and notifying failure. Only actually finish (close the worktree, mark failed) once the
pane is gone or has been idle at an empty shell prompt (herdr's own signal that the session ended).
Also consider: `runInHerdr`'s catch block (`herdr.js:231-234`) could distinguish a wait-timeout
(`err.message` matching herdr's `timeout` error code) from a real crash, and pass that through
instead of collapsing both to the same `{ code: 1 }`, so `run.js` doesn't even need to re-derive it
from pane liveness alone. Add a test that a `paneLive` task past `taskMs` is left alone, not closed.

_GitHub issue #60 — end the commit subject with `(#60)`._
