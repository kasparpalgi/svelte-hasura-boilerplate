> Run with: Opus 5 / high

# Runner launches Claude inside a herdr pane, not as a bare child

## Original Requirement

[NEVER REMOVE]

From the 025 session, 2026-09-05. After wiring phone access to herdr
(`https://herdr.servicehost.io`, task 025), Kaspar moved a card to the TODO list and the
phone showed no sessions. Diagnosis: the runner spawns `claude -p` as a direct child of
the launchd daemon, so herdr never sees it.

> "Fixing that means having the runner launch Claude inside a herdr pane rather than as a
> bare child — then card → runner → visible agent on your phone, which is the loop you've
> been after since 021." — "yes do it"

**Depends on 027 — run that first.** The target workflow both tasks build toward is
documented at the top of `027-runnerNeverWedges.md`. A visible agent is no use while the
queue is wedged, and 027 is the smaller change.

## The gap

```
card moved → server writes NNN-TODO.md → runner pulls → claude -p (PID child of runner)
                                                          └── invisible to herdr, phone shows agents=0
```

Verified on 2026-09-05 while task 155 was actively running:

```
$ herdr pane list   → {"panes":[]}
$ herdr agent list  → {"agents":[]}
service.err         → msg="inventory committed" agents=0 topology=0
$ ps -o ppid= -p 86060  → 20088   # the runner, not a herdr pane
```

Herdr only inventories agents running in its own panes. This is also why task 019
("visible runner with herdr") never delivered: it reached for tmux, and the runner's
current form does not use tmux either.

## Verified herdr API

From `herdr --skill` (the CLI's own agent reference — run it, do not guess):

```bash
herdr pane split --current --direction right --cwd "$PWD" --no-focus   # → .result.pane.pane_id
herdr agent start <name> --kind claude --pane <pane-id> -- <native-claude-args...>
herdr agent prompt <name> "/todo NNN" --wait --timeout 120000
herdr agent wait  <name> --until blocked --timeout 120000
herdr agent read  <name> --source recent-unwrapped --lines 200
herdr agent get   <name>
```

Semantics that matter here:

- `agent start` returns only once herdr detects the agent ready for input; if it is blocked
  during startup it returns `agent_not_ready` but the name stays usable for `read`.
- `agent prompt --wait` waits for the first settled `idle`, `done`, or `blocked`. That is
  the runner's completion signal. Do not add `--until` for the normal path.
- `agent prompt` refuses an agent sitting at an approval dialog with `agent_blocked`.
  **That is the feature, not an error** — it is the hook for the 021 loop.

## Design

Replace the `shell("claude", …)` call in `run.js` with a herdr path, behind a config flag
(`useHerdr: true`), keeping the current headless path as fallback.

1. **Pane.** The runner has no caller pane (`$HERDR_PANE_ID` is unset under launchd), so it
   cannot use `pane split --current`. It must create its own tab in the `default` session.
   **Open question — resolve first:** exact `herdr tab create` flags (cwd, name). `--help`
   on sub-subcommands falls through to top-level help; run bare `herdr tab` and
   `herdr agent` to list real options, per the skill doc's own instruction.
2. **Start** `claude` in that pane, named `task-NNN`, cwd = repo path.
3. **Prompt** `/todo NNN` with `--wait`.
4. **On `blocked`** → Pushbullet "needs your input" → `herdr agent wait --until idle`.
   Kaspar answers from the phone. This is the whole point of the task.
5. **On `idle`/`done`** → `herdr agent read` → write `NNN-slug.log` (replaces the captured
   stdout from task 025; same file, same gitignore rule).
6. **Close the pane**, then the existing HEAD-compare + `git push` logic, unchanged.

### Permission model — decided: `--permission-mode acceptEdits`

Drop `--dangerously-skip-permissions` on the herdr path and pass
`--permission-mode acceptEdits` instead. Verified present in Claude Code 2.1.261
(`choices: acceptEdits, auto, bypassPermissions, manual, dontAsk, plan`).

Why this one:

- File edits are the bulk of a `/todo` run and flow without prompting, so tasks do not
  stall on routine work.
- Bash and destructive operations still prompt → the agent settles to `blocked` → phone.
  That is the 021 loop, and it is the only reason to build this task.
- `bypassPermissions` would reproduce today's blind headless behaviour with extra steps.
  `manual` would block on nearly every step and be unusable overnight.

The relay answers these prompts natively — its README lists *"Answer approvals and
structured plan questions from Codex, Claude Code"*. No Claude Remote Control needed on
this path; see the architecture decision in 027.

Keep `--dangerously-skip-permissions` reachable via config (`unattended: true`) for runs
where nobody will be watching a phone.

## Risks

- **Self-modification.** This task edits `run.js` and needs a `launchctl kickstart` to take
  effect. If the runner executes this task, it kills its own Claude session mid-run. Hence
  the filename has no `-TODO` suffix: `findPending()` ignores it, so the runner will not
  pick it up. **Run it manually with `/todo 026`.**
- **Blocked forever.** A task waiting on input with the phone in a pocket holds a pane and
  stalls the queue. Needs a wall-clock cap → notify → close pane → leave the file as TODO.
- **herdr server down.** `dev.herdr.server` is a LaunchAgent and was up throughout, but the
  runner must detect its absence and fall back to headless rather than wedge.
- **Panes leaking** on crash. Reap `task-*` agents older than the cap at tick start.

## Verification

- [ ] `herdr agent list` shows `task-NNN` while a card is being worked
- [ ] The agent appears on the phone at `https://herdr.servicehost.io` during the run
- [ ] `NNN-slug.log` still written, still gitignored, tree still clean afterwards
- [ ] A permission prompt reaches the phone and can be answered from it end-to-end
- [ ] herdr server stopped → runner falls back to headless, does not wedge
- [ ] Pane closed and agent gone after completion; no `task-*` leaks after 3 runs
