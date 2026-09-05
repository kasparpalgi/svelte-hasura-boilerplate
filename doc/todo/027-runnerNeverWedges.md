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
