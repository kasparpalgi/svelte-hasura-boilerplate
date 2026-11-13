> Run with: Opus 5 / high
> Machine: karel (the stuck run's log is here)

# Unstick task 038

## Original Requirement

[NEVER REMOVE]

The runner ran `doc/todo/038-033Opus55-TODO.md` twice and neither run renamed it to -DONE or
-BLOCKED, so it is skipped now and its card waits in TODO.

Find out why: read that run's transcript `/home/krl/Documents/GitHub/svelte-hasura-boilerplate/doc/todo/038-033Opus55.log` and the work it
left (`git stash list` — the runner parks a dirty run's work there). Then finish the
task itself: do what is left, append its `## Results` and rename it -DONE.md — or,
when a person must act, say exactly what and rename it -BLOCKED.md. If the cause is in
the runner or the /todo skill rather than the task, say so in this file's Results.

## Results

**Summary** — 038 never ran. Its whole transcript is two lines:

```
herdr read failed: Command failed: herdr agent read task-038 --source visible --lines 400
{"error":{"code":"agent_not_found","message":"agent target task-038 not found"}}
```

The runner opened a herdr pane, the pane never registered an agent, and the runner had
no way to tell that from "the agent ran and said nothing". It logged the read failure,
left the file `-TODO.md`, and took the same card again on the next tick with the same
result. `git stash list` is empty in both the clone and the worktree — there was no
work to recover, because no session ever started.

**The cause was in the runner, not the task.** It is already fixed, by the same session
that fixed #36 on 24/09: `herdr.js` now tracks whether a pane ever registered an agent
(`started`), `run.js` retries once with a fresh pane when it did not, and reports "the
agent never started in its pane" instead of a bare herdr error. The newer unstick
behaviour — filing `NNN-unstickNNN-TODO.md` instead of silently re-running — is what
produced this card, so the loop that wedged 038 cannot repeat silently.

Task 038 itself is finished and renamed `-DONE.md`; its own Results carry the detail.
Short version: the model-id half was fixed in `9df47d2` (#36) the day after the card was
written, and the half still outstanding — the Kanban's tier table pinning a bare `opus`
to Opus 5 while the runner's `latest` had moved to 5.5 — is fixed in `e2da332`.

**Files changed**
- `doc/todo/038-033Opus55-TODO.md` → `-DONE.md`, with its Results
- `doc/todo/096-unstick038-TODO.md` → `-DONE.md` (this file)
- in `svelte-todo-kanban` (`e2da332`): `src/lib/server/taskfile.ts`,
  `src/lib/server/__tests__/taskfile.test.ts`, `package.json`

**Verification** — `vitest --project=server` 508 passed / 5 skipped and `npm run check`
clean in `svelte-todo-kanban`; live `classify.js` resolution checked by hand. Nothing in
this repo changed beyond the two task files, so its own suites were not run.

**Deviations** — None. No human action is needed, so this is `-DONE`, not `-BLOCKED`.
