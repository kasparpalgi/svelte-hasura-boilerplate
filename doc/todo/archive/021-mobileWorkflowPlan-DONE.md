020 was completed and the task I created in canban board was completed and moved to review but in the task file the agent texts were not added - also let me know where I can see the agent working when I want and see all the agents currently working and how can I get on mobile notification when agent needs anything from me or completes

final check the whole workflow and make fully operable from mobile via voice. Or maybe completion just a notification at todzz kanban but still I want herdr or something to tell if agent has questions and then interact from mobile

---

## Answers

### Why 020's agent texts weren't in the task file

The runner (`run.js`) spawns Claude with `claude -p '/todo NNN' --dangerously-skip-permissions`.
The `/todo` skill tells Claude to append a Results section (step 6), but in headless print mode
Claude may finish the code work and hit context limits before writing the Results block. The
runner collects `stdout` but only uses it on _error_ (tail of output posted as a card comment).
On success it just says "committed as `abc123`" — the full agent output is discarded.

**Fix needed:** save the runner's captured `output` to a log file (`NNN-slug.log`) and/or
ensure the `/todo` skill's Results step runs even when context is tight.

### Where to see agents working

| Method | When to use |
|---|---|
| `tmux attach -t kanban-runner` | Interactive mode (019). Live streaming output. |
| Runner stdout/launchd log | Headless mode. `log show --predicate 'process == "node"'` |
| `ps aux \| grep "claude.*todo"` | Check if any Claude process is running right now |

The runner processes **one card at a time** by design, so there's at most one active agent.

### Mobile notifications — what exists today

1. **Claude Code PushNotification** — built-in tool. Sends desktop + phone push when
   Remote Control is connected. Works in interactive sessions, not in headless `-p` mode.
2. **herdr** (from 019) — watches a tmux pane for patterns (permission prompt), dings on
   match. Requires `--interactive` mode. Already documented in the runner README.
3. **Todzz card comments** — the runner already posts a comment and moves the card to
   Review/Blocked on completion. If todzz had push notifications, this would be the
   notification.

### Mobile voice workflow — current state

| Step | Works today? |
|---|---|
| Voice → card in todzz kanban | Yes (mobile browser voice input) |
| Runner picks up card from TODO | Yes |
| Agent executes task | Yes (headless) |
| Card moves to Review on completion | Yes |
| **Push notification to phone** | **No** — missing piece |
| **Interact with agent from phone** | **No** — needs interactive mode + mobile terminal or todzz chat |

## Follow-up tasks filed

- `022` — Save runner output to log file, make Results step resilient
- `023` — Push notification pipeline: runner → phone on completion/questions
- `024` — Mobile agent interaction via todzz (chat-on-card or similar)

## Results

**Summary** — Answered all questions about agent visibility, mobile notifications, and
mobile workflow. Diagnosed why 020's agent texts were missing (runner discards stdout on
success). Filed three follow-up tasks (022–024) covering output logging, push notifications,
and mobile interaction.

**Files changed**
- Modified: `doc/todo/021.md` — answers + follow-up plan
- Created: `doc/todo/022.md` — runner output logging task
- Created: `doc/todo/023.md` — push notification pipeline task
- Created: `doc/todo/024.md` — mobile agent interaction task

**Verification** — N/A (planning task, no code changes)

**Deviations** — None
