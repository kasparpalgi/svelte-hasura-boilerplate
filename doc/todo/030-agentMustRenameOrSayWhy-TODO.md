> Run with: Opus 5 / high

# An agent that decides "already done" must still finish the file

## Original Requirement

[NEVER REMOVE]

Split out of task-028 (item 4). `157-errors-TODO.md` in `svelte-todo-kanban` did its
work and committed it (66cd03e), then the agent concluded "the task was already
completed, no further action needed" — and stopped without appending `## Results` or
renaming to `-DONE`. The runner is working as designed here: it saw an un-renamed file,
reported `⚠ did not finish`, re-ran it, hit the same ending, and skipped it as a stuck
task. Two wasted runs and a dead queue slot for something that was finished the whole
time. Task-028 closed 157 by hand; this task stops it recurring.

## The actual gap

`skills/todo/SKILL.md` step 6 tells the agent to append Results and rename. It reads as
the tail of a happy path, so an agent that exits early — "nothing to do", "already
done", "blocked" — walks past it. The rename *is* the state, so skipping it is the one
step that cannot be skipped.

## What to build

In `klarity-claude-kit`:

1. **Make step 6 unconditional in `plugins/dev-kit/skills/todo/SKILL.md`.** Every exit
   path ends by writing `## Results` and renaming — `-DONE.md` when the work is complete
   *or was already complete*, `-TODO.md` when a human is needed. "Already done" is a
   `-DONE` with a Results section saying so and naming the commit. Say this where an
   agent bailing early will actually read it, not only at the end.

2. **Consider a cheap net in the runner.** `src/run.js` already detects the exact
   condition (`renamed === false` with a clean tree). A clean tree plus an un-renamed
   file is nearly always "the agent thought it was done" — the ⚠ notification could say
   that outright, or a `--fix-stuck` pass could ask a haiku call to read the file and
   rename it. Judge whether this earns its complexity; the skill fix may be enough on
   its own. If it is, say so and skip it rather than building it.

## Also observed in the same run, unexplained

The user watched the agent's herdr pane vanish mid-work on the phone, then reappear, and
no Telegram notification arrived for it. Worth a look while in `herdr.js`:
`runInHerdr()` closes the task tab in its `finally`, and `reap()` closes any surviving
`task-*` agent at the *start* of the next run — so a second tick overlapping a live run
would kill a working pane. Confirm whether one tick can start before the previous
finishes (`tick()` is awaited in the main loop, so it should not — but the pane
disappearing says otherwise). Check `notify.js` for why the silence.
