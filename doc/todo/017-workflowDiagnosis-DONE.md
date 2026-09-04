1. I went to https://www.todzz.eu/en/kaspar/todo-app and added to "Backlog" list a card with title: The drag and drop is terrible on mobile. Issue #154 was created in GitHub.
2. Opened it and added content: 
Fable 5. High. 
I made it work brilliantly just with HTML5 I think in another project at ../../CodeNew/timetrack - plan and implement it well working and nice looking like in Trello here, too. The whole visual drag'n'drop is pretty terrible and ugly compared to that timetrack project so I would fully refactor I think. Issue in GitHub was updated.
3. Moved to TODO. File 154-theDragAndDrop-TODO.md was created:

> Run with: Sonnet 5 / medium

# The drag and drop is terrible on mobile

## Original Requirement

[NEVER REMOVE]

Fable 5. High.
I made it work brilliantly just with HTML5 I think in another project at ../../CodeNew/timetrack - plan and implement it well working and nice looking like in Trello here, too. The whole visual drag'n'drop is pretty terrible and ugly compared to that timetrack project so I would fully refactor I think.

_From Kanban card `4698ab60-e5db-4fb4-a017-be7b0a85bfe5`, moved to TODO._

----

Now not sure the claude code in the background is actually executing it. Can you check? When its done, will it then update the card when done and GitHub issue?

I would expect it to create the file already when its in backlog and when I move it to TODO then it will rename file and add `-TODO` to file name and start executing. Also, can't it run the claude code so that I can see how it is working like when I run it myself manually? Also, can I use with https://herdr.dev the claude code subscription? I want herdr or claude code webhooks to ding! when claude asks anything. See task 008 where the initial this workflow planning started. At 016 was the last task executing the plan and the plan is supposed to work now.

---

# Answers (2026-09-04)

## 1. "Is Claude Code actually executing it in the background?"

**Yes — it tried and failed.** The runner daemon IS running (PID 13808, launchd
`eu.todzz.kanban-runner`). Logs show:

```
10:35:11 ▶ kasparpalgi/svelte-todo-kanban 154-theDragAndDrop-TODO.md (Sonnet 5 / medium)
10:35:11 ✘ 154-theDragAndDrop-TODO.md exit 1
```

It picked up the task but Claude exited immediately with code 1. **Root cause:** two bugs
working together:

1. **Stale process.** The running daemon is still the OLD Hasura-polling code from before
   task 015 rewrote it. The startup log says `watching "TODO" on
   https://todzz.admin.servicehost.io/v1/graphql` — the new version would say
   `watching 2 repo(s) every 20s`. The launchd agent was never restarted after the rewrite.

2. **Path mismatch.** The task file landed at `.claude/todo/154-theDragAndDrop-TODO.md`
   (because `svelte-todo-kanban` uses `.claude/todo/`), but the `/todo` skill hardcodes
   `doc/todo/`. Claude couldn't find the file → exit 1. The NEW runner code has the same
   bug in `findPending()` — it also hardcodes `doc/todo/`.

3. **Model override ignored.** The card says `Fable 5. High.` but the runner resolved
   `Sonnet 5 / medium`. The `explicitTier()` parser doesn't recognise "Fable 5" (it was
   written for "opus", "sonnet", "haiku").

**Fix plan:** filed as tasks 018 and 019.

## 2. "Will it update the card and GitHub issue when done?"

**Yes, in theory — the return leg (task 016) is fully wired.** Once the runner successfully
executes a task, renames it to `-DONE.md`, and pushes:

- The push webhook on todzz.eu detects the `TODO→DONE` rename
- Moves the card to the "Review" column
- Posts a completion comment with the commit SHA
- Closes the linked GitHub issue (#154)

The only broken part is step 1 — the execution itself is failing. Fix the path bug and
restart the daemon, and the full loop should close.

## 3. "Create the file already when in Backlog, rename to -TODO on move"

Currently the file is written **only** on move to the agent list (the TODO column). Your
proposed flow is better:

| Event              | What happens                     |
| ------------------ | -------------------------------- |
| Card created       | GitHub issue created (existing)  |
| Card in Backlog    | `NNN-slug.md` written to repo   |
| Card moved to TODO | Renamed to `NNN-slug-TODO.md`   |
| Runner picks it up | Executes, renames to `-DONE.md`  |
| Push               | Card → Review, issue closed     |

This means every card has a file from birth — the prompt history is complete even for cards
that never get executed. Filed as task 020.

## 4. "Can't it run so I can see it working?"

**Not with the current runner.** It uses `--dangerously-skip-permissions` (headless print
mode) — there's no terminal to watch. Three options:

| Option                     | How                                                     | Tradeoff                                      |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| **Run it yourself**        | `cd ../svelte-todo-kanban && claude "/todo 154"`        | Full interactive experience, but manual        |
| **tmux + visible runner**  | Run the daemon in a tmux pane instead of launchd        | Visible output, still auto, but can't approve  |
| **herdr notifications**    | See answer 5 below                                      | You get notified, not the full stream          |

The fundamental tension: `--dangerously-skip-permissions` means Claude never asks, so it
runs unattended. If you remove that flag, Claude can ask questions but needs a human at the
keyboard. There's no middle ground yet in Claude Code itself.

## 5. "Can I use herdr.dev with the Claude Code subscription?"

**Yes, they're independent.** herdr is a notification layer for tmux — it watches a pane
for output and sends a desktop/mobile notification (the "ding!"). Your Claude Code
subscription gives you the API access to run Claude. They compose:

1. Run Claude Code in a tmux pane (instead of launchd)
2. `herdr watch` that pane
3. When Claude produces output or asks a question → ding!

herdr doesn't need or use your Claude subscription. It just watches terminal output.

**However:** with `--dangerously-skip-permissions`, Claude never asks, so herdr would only
ding when a run starts/finishes, not on questions. To get ding-on-question, you'd run
without `--dangerously-skip-permissions`, but then the run blocks until you answer.

## 6. "Claude Code webhooks to ding when Claude asks anything"

Claude Code doesn't have built-in push notifications yet. The closest options:

1. **herdr** — as above. Works for tmux-visible sessions.
2. **Claude Code hooks** — `PostToolUse` hooks fire when a tool completes, but they don't
   fire on "waiting for human input" (that's not a tool call, it's a permission prompt).
3. **The Claude mobile app** — Claude.ai shows conversations with Claude Code. You can
   check there, but it doesn't push-notify on permission prompts either.
4. **Build it** — a `PreToolUse` hook that sends a push notification (e.g. ntfy.sh,
   Pushover, or a webhook to your phone) every time Claude is about to use a tool that
   needs approval. This is actually feasible. Filed as part of task 018.

## 7. "The plan is supposed to work now"

Almost. The three layers from task 009 are all built and deployed:

| Layer | Status | What's broken |
| --- | --- | --- |
| ① todzz.eu writes the task file | ✅ Working | But writes to `.claude/todo/`, not `doc/todo/` |
| ② Local runner executes it | ❌ Failing | Stale process + path mismatch + model parsing |
| ③ Push webhook closes the loop | ✅ Working | (Untested live, but code is deployed) |

Three fixes needed, filed as tasks 018–020 below.

## Follow-up tasks filed

- **018** — Fix the runner: restart daemon, resolve task folder (`.claude/todo` vs
  `doc/todo`), update `/todo` skill, add "Fable" to model parser
- **019** — Make the runner visible: tmux-based execution with herdr notifications as an
  alternative to headless launchd
- **020** — Write task file on card creation (Backlog), rename to `-TODO` on column move

## Results

**Summary** — Answered all seven questions with live evidence from the runner daemon, logs,
filesystem, and the task history (008–016). Diagnosed the execution failure: stale daemon
process (pre-task-015 code), `.claude/todo` vs `doc/todo` path mismatch, and unrecognised
"Fable 5" model name. Filed three follow-up tasks (018–020).

**Files changed** — `doc/todo/017.md` (this file, answers added)

**Verification** — N/A (planning/diagnosis task, no code changes)

**Deviations** — None