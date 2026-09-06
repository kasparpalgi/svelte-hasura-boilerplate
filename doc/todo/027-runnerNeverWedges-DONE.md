> Run with: Opus 5 / high

# Runner must never wedge or grind silently

## Original Requirement

[NEVER REMOVE]

From the 025 session, 2026-09-05. Kaspar moved a card to the TODO list and nothing
happened. The runner had been refusing that repo every 20 seconds since 2026-09-04 with no
signal of any kind:

```
20:16:58 skip kasparpalgi/svelte-todo-kanban — dirty working tree
```

> "document in followup todo(s) and plan the best workflow rather than asking me to make
> the best ever"

**Run this before 026.** Visibility is worthless while the queue is wedged.

---

## Target workflow (the thing 027 + 026 together deliver)

```
todzz card → agent list
  ├── server writes NNN-slug-TODO.md, pushes                    014 ✅ working
  ├── runner tick: pull, pick lowest pending                    ✅ but wedges → 027
  ├── runner opens a herdr tab in the repo cwd                  → 026
  ├── herdr agent start task-NNN --kind claude
  │        --permission-mode acceptEdits                        → 026
  ├── herdr agent prompt "/todo NNN" --wait                     → 026
  │     ├── blocked → Pushbullet → answer in the relay PWA      → 026 (closes 021)
  │     └── idle/done → agent read → NNN-slug.log               025 ✅ rewired in 026
  ├── /todo renames to -DONE.md, commits, pushes                skill step 6–7
  └── Pushbullet with the last 15 lines                         025 ✅ working
```

**Architecture decision — herdr relay, not Claude Remote Control.** Task 024 enabled
`remoteControlAtStartup`, which answers permission prompts from the Claude mobile app. The
relay is the better fit for the runner: its README states it can *"Answer approvals and
structured plan questions from Codex, Claude Code"*, and it also shows the terminal, the
workspace and the agent lifecycle — not just the prompt. It is installed, paired and
permanent (`https://herdr.servicehost.io`, task 025). Remote Control stays on for sessions
Kaspar starts by hand. One path for the runner, decided.

---

## The three failure modes

### 1. Dirty tree → permanent silent skip (what actually happened)

An earlier `/todo 154` run wrote its result into `154-theDragAndDrop-TODO.md` and never
committed it. `git status --porcelain` was non-empty, so the guard skipped the repo — every
tick, forever, with no notification. Cards piled up on the board with nothing consuming
them.

**Fix.** Classify the dirt:

- Changes confined to the task folder (`doc/todo/` or `.claude/todo/`) are **agent
  artifacts, not human work**. Commit them (`chore(todo): checkpoint uncommitted agent
  output`) and carry on.
- Changes anywhere else are real work in progress. Skip — but notify **once** per repo per
  dirty streak, not every tick, and say which paths are blocking.

### 2. Same task re-run forever

Even with a clean tree, 154 stayed named `-TODO.md` while being complete, so the runner
would have picked it again on every tick. A task that fails to rename itself is an
infinite, billable loop.

**Fix.** After a run, if `NNN` is still `-TODO` with no `-DONE` and HEAD did not advance,
that is a non-completion. Count consecutive non-completions per `NNN` in a small local
state file (outside the repo). At 2, notify and skip that number for the rest of the
process lifetime so the queue advances instead of grinding.

### 3. No observability

The runner logs to `~/Library/Logs/kanban-runner.log`, which nobody reads. Every state
above is invisible until someone asks why the board is stuck.

**Fix.** `--check` reports, per repo: pending task, dirty paths, non-completion counts, and
whether the herdr server is up. One Pushbullet on entering a blocked state, one on leaving
it. Never repeat.

---

## Also: give the `/todo` skill's Results step teeth

Task 025 added "never skip this step" to `todo/SKILL.md`. 154 proves prose is not enough —
that run left the file modified, unrenamed and uncommitted. Add a step 8 self-check to the
skill: confirm the task file is renamed and `git status --porcelain` is empty before
reporting success; if either fails, say so loudly in the final message.

## Files

`klarity-claude-kit`:

- `plugins/dev-kit/runner/src/run.js` — dirt classification, non-completion counter, richer `--check`
- `plugins/dev-kit/runner/src/state.js` *(new, small)* — per-repo blocked/non-completion state
- `plugins/dev-kit/skills/todo/SKILL.md` — step 8 self-check
- `plugins/dev-kit/runner/README.md` — document the guards

Keep `run.js` under 200 lines; move state handling out rather than growing it.

## Verification

- [ ] Repo dirty only in the task folder → runner commits it and proceeds (reproduce 154)
- [ ] Repo dirty in `src/` → skipped, exactly one Pushbullet, no repeat next tick
- [ ] Task that does not rename itself → second attempt notifies and is skipped; the next
      number runs
- [ ] `--check` shows pending task, dirty paths, skip counts, herdr server state
- [ ] Existing green path unchanged: clean repo → task runs → `.log` written → pushed
- [ ] `node --check`, and an end-to-end run against a scratch repo with a stub `claude`
      (the harness from 025 works: bare repo as origin, fake `claude` on `PATH`,
      `KANBAN_RUNNER_CONFIG` pointing at it)

## Note on execution

No `-TODO` suffix on this filename, deliberately: `findPending()` ignores it, so the runner
will not pick up a task that rewrites and restarts the runner mid-run. Run it by hand with
`/todo 027`, then `/todo 026`.

----

Related, and visible right now: after the daemon restart, svelte-todo-kanban is checked out on 155-githubFullIntegration with no upstream, so git pull --ff-only fails and the repo is skipped silently every tick. That board consumes nothing until the branch is sorted. I left it alone — switching your checked-out branch isn't the runner's call, and notifying on it is 027's job. 027 is the next thing to run. ---- SORT OUT THE BRANCH AND EVERYTHING!!!! AFTER THIS EVERYTHING MUST WORK: TODO BOARD CARD - CLAUDE CODE STARTS - I SEE IT FROM MOBILE OR MAC OR ANY COMPUTER VIA HRDR - DING! ON MOBILE IF AGENT NEEDS TO ASK ME OR FINISHED - UPDATE BOARD/GITHUB ISSUE/TODO FILE WHEN DONE + SIMPLE INSTRUCTIONS IN README HOW TO SET UP BOARD WITH MAC HARD DRIVE LOCATION OF THAT REPO ON NEW PROJECTS. LAST THING AT THS FILE POINT TO THOSE INSTRUCTIONS.
---

## Results

**Summary** — The runner no longer has a silent skip. Every reason it can decline to run
a repo is now either self-healed or announced exactly once, on the edge into and out of
that state.

- **Dirt in the task folder is agent debris, not human work.** It gets committed as
  `chore(todo): checkpoint uncommitted agent output` and the tick carries on. This is
  exactly the 154 wedge, and it healed the live boilerplate clone on the first tick after
  the restart.
- **Dirt anywhere else is your work in progress.** The repo is skipped with one
  **⛔ blocked** push naming the paths, silence on every later tick, and one
  **▶ unblocked** when the tree is clean again.
- **Work left on a task branch is pushed and handed back.** The runner returns to the base
  branch (`origin/HEAD`, never assumed to be `main`), sends **↗ task on a branch**, and
  marks that number so it is not re-run against a base branch that has none of the work.
  A branch already merged is left silently. Detached HEAD, unreachable origin and a
  diverged base each block with their own named reason.
- **A task that runs but never renames itself gets two attempts.** Then one **⏭ stuck
  task** push and that number is skipped, so the queue advances instead of grinding
  billably forever. Attempts are keyed on the task file's mtime: editing the file is the
  retry gesture, no command needed.
- **Checkpoint commits are pushed.** Committing leftovers left the clone ahead of origin,
  which would have failed `pull --ff-only` the moment the server pushed the next task
  file — a new wedge introduced by the fix for the old one. Caught in test, closed.
- **`--check` is now a status page**: per repo the path, current branch, task folder,
  dirty paths, blocked reason, and every pending task with its attempt count, plus
  whether the herdr server is up.

State lives in `~/.kanban-runner/state.json`, deliberately outside every repo so runner
bookkeeping can never be the thing that dirties a working tree.

**The kanban branch, sorted.** `svelte-todo-kanban` was checked out on
`155-githubFullIntegration` with no upstream — one commit ahead of `origin/main`, nothing
behind, never pushed. Fast-forwarded into `main`, type-checked, pushed, branch deleted.
The repo is now on `main`, clean and in sync. The root cause was policy, not git: that
repo's `CLAUDE.md` told every agent to `git checkout -b NNN-featureName`, which parks the
`-DONE` rename on a branch the runner never sees. That rule now reads "commit straight to
`main`; branch only when a human asked you to". The runner's branch handoff stays as the
safety net for when an agent branches anyway.

**`/todo` step 8.** Task 025 added "never skip this step" as prose and 154 ignored it.
There is now a step 8 with commands: confirm the task file is renamed, confirm
`git status --porcelain` is empty, and if either fails say so loudly in the final message
rather than reporting success.

**Files changed**

- `klarity-claude-kit/plugins/dev-kit/runner/src/repo.js` *(new, 104 lines)* — git
  preflight: dirt classification, base-branch return, fetch/pull, push of local commits
- `klarity-claude-kit/plugins/dev-kit/runner/src/state.js` *(new, 80 lines)* — blocked
  reasons and mtime-keyed attempt counts in `~/.kanban-runner/state.json`
- `klarity-claude-kit/plugins/dev-kit/runner/src/queue.js` *(new, 53 lines)* — task folder
  → pending list, attempt-limited pick
- `klarity-claude-kit/plugins/dev-kit/runner/src/run.js` — rewired around the above;
  201 → 166 lines, added `--once`, pushes `HEAD` rather than assuming `main`
- `klarity-claude-kit/plugins/dev-kit/runner/README.md` — "Connect a new project",
  "Guards — why it never wedges", notification table, file map
- `klarity-claude-kit/plugins/dev-kit/skills/todo/SKILL.md` — step 8 self-check
- `klarity-claude-kit/plugins/dev-kit/.claude-plugin/plugin.json` — 0.5.0 → 0.6.0
- `klarity-claude-kit/plugins/dev-kit/runner/package.json` — 0.3.0 → 0.4.0
- `svelte-todo-kanban/CLAUDE.md` — branch rule; plus `main` fast-forwarded to 155

**Verification**

| Check | Result |
| ----- | ------ |
| Dirty only in the task folder → committed, run proceeds | ✅ scratch harness, and live on the boilerplate clone |
| Dirty in `src/` → skipped, one Pushbullet, silent on ticks 2 and 3, one on recovery | ✅ |
| Task that never renames → 2 attempts, one ⏭ push, next number runs | ✅ |
| Editing a skipped task file retries it | ✅ |
| Task branch with unpushed commits → pushed, back to `main`, handed off, not re-run | ✅ |
| Unpushed local commit on base → pushed before the next task | ✅ |
| Green path unchanged: clean repo → task runs → `.log` written → pushed | ✅ |
| `--check` shows branch, dirty paths, blocked reason, attempt counts, herdr state | ✅ herdr up, both repos on `main` |
| `node --check` on every module | ✅ |
| Live daemon restarted, both real repos clean and in sync | ✅ log quiet since 08:21 |
| `npm run check` in `svelte-todo-kanban` before pushing `main` | ⚠️ 19 pre-existing errors, all in files 155 never touched (missing `marked`, `d3-scale` deps). Not caused by the merge; not fixed here |

**Deviations**

- Split into `repo.js` + `queue.js` + `state.js` rather than the planned single
  `state.js`, to keep `run.js` under 200 lines as the task asked.
- The task file said switching a checked-out branch "isn't the runner's call". It is now,
  in one narrow case: the tree is clean and the branch's commits have been pushed, so
  nothing can be lost, and the alternative is a queue that stays wedged. Every switch is
  logged and notified.
- Added `--once`. The end-to-end harness needs a single tick, and so does anyone poking
  at the runner by hand.
- Went beyond the file: merged and deleted the stuck kanban branch, and changed that
  repo's branch policy. The runner guard alone would have left every kanban card waiting
  on a manual merge.

**Setting up a new project** — board → repo → path on this Mac, and the daemon restart:
[`klarity-claude-kit/plugins/dev-kit/runner/README.md` → "Connect a new project"](https://github.com/kaspar-palgi/klarity-claude-kit/blob/main/plugins/dev-kit/runner/README.md#connect-a-new-project).
The guard behaviour above is documented in the same file under "Guards — why it never
wedges".
