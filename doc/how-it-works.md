# How the Kanban → Claude Code pipeline works

A short technical overview of the agentic dev flow, and an honest comparison with the
Claude desktop / mobile apps. Written in task 082 (Nov 2026).

## The pieces

| Piece                   | Where it lives                              | Job                                                       |
| ----------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Kanban board (todzz.eu) | `svelte-todo-kanban`                        | Cards, lists, model/effort/machine pickers, cost per card |
| Task files              | `doc/todo/` in every repo                   | One markdown file per request — the prompt history        |
| Runner daemon           | `klarity-claude-kit/plugins/dev-kit/runner` | Node daemon on each machine; polls git, starts sessions   |
| `dev-kit` plugin        | `klarity-claude-kit`                        | The `/plan`, `/todo`, `/verify` skills every session uses |
| herdr                   | each machine, `herdr.servicehost.io`        | Terminal panes you can watch and type into from the phone |
| Pushbullet              | phone + watch                               | "needs you" / finished / blocked notifications            |

## The loop, step by step

1. **Card.** Write a card on the board (typed or voice) and pick model, effort and
   machine — or leave any of them on **Auto**.
2. **Draft file + issue.** The server creates a GitHub issue and pushes
   `NNN-slug.md` (NNN = issue number) to the repo. The file starts with
   `> Run with: <model> / <effort>` and, if a machine was picked, `> Machine: <name>`.
   The card links to the file.
3. **Queue it.** Moving the card to the agent ("TODO") list renames the file to
   `NNN-slug-TODO.md` and pushes. Nothing else marks a task as queued — **the filename
   is the state**; there is no database of runs.
4. **Pick up.** Each of the 4 machines (Mac, Karel, Dell, Windows/WSL) runs the daemon,
   which every `pollSeconds` (20 s here) does `git pull --ff-only` and looks for
   `-TODO.md` files without a matching `-DONE`/`-BLOCKED`.
   - `> Machine:` set → only that runner takes it.
   - Machine **Auto** → any free runner may take it, but first claims the card with a
     compare-and-swap on its `agent_machine` field, so exactly one runner wins.
   - Model **Auto** (no `Run with:` line) → a cheap Haiku call picks the model family;
     falls back to `Sonnet 5 / medium`. A `Gemini` tier runs free Gemini Flash through
     aider instead of Claude, for simple tasks.
5. **Run.** The runner opens a herdr tab and starts `claude --model … --effort …` with
   `/todo NNN`. Each machine is logged in to its own €18 Pro subscription — mine plus
   three friends' who use well under half their weekly allowance.
6. **Watch and answer.** The herdr pane is live on the phone. When the agent blocks on a
   question it sends **"Runner ⏸ needs you"** to Pushbullet (phone beeps, watch
   vibrates); answer in the relay PWA with one tap on a suggested option, or dictate.
   Hitting the usage limit parks that machine until the reset time the CLI reports.
7. **Finish.** `/todo` appends a plan, then `## Results` (summary, files changed,
   verification, deviations) under the untouched original prompt, renames the file to
   `-DONE.md` or `-BLOCKED.md`, commits with `(#NNN)` and pushes. The runner moves the
   card to Review and posts the result, duration and API-list cost on the card and issue.
8. **Follow-ups.** Work the agent splits off is written as suffixless `NNN-slug.md`; the
   runner files each one as an issue + Backlog card. They never run on their own.

## Why the file history is the best part

`doc/todo/` is a searchable, git-versioned log of every prompt and its outcome. You can
say "in todo 138 feature X was built and 277 fixed Y there — now check why…" and the
agent reads both files. It's plain markdown, so it works the same with any model,
tool or person.

## Compared with the Claude desktop and mobile apps

The official apps have improved a lot: Claude Code in the desktop app with parallel
sessions, Claude Code on the web (cloud sessions), Remote Control of a local session
from the phone, push notifications, scheduled routines, and the mobile app.

### Where this system is better

- **Several subscriptions in one queue.** Four machines, four accounts, one board.
  Usage that would be wasted gets used, and a usage limit on one machine doesn't stop
  the queue. The apps tie you to one account per session.
- **Project management built in.** Lists, backlog, Review column, follow-up cards,
  cost per card and per list. The apps have a session list, not a board.
- **Queue first, not chat first.** Ten cards can wait their turn overnight; nobody has
  to start each session.
- **Permanent, linkable prompt history in the repo.** App conversations live in the
  app; here every prompt + outcome is a file in git, numbered with the issue.
- **Per-task model / effort / machine**, chosen from the card or picked automatically,
  plus a free Gemini tier for simple work.
- **Your own machines.** Real local env, databases, secrets and long-running services,
  and no cloud sandbox limits.

### Where the official apps win

- **No setup or upkeep.** No daemons, systemd/launchd units, herdr servers, Pushbullet
  tokens or per-machine plugin installs. Most of the 80+ task files here are plumbing.
- **Better UI for the session.** Diffs, file trees, artifacts, images and a proper
  chat UI; a herdr pane is a terminal on a small screen.
- **Native notifications and Remote Control** work out of the box and are better
  integrated than Pushbullet + a relay PWA.
- **Cloud sessions** run with the laptop closed and don't need a machine of your own.
- **Fewer moving parts to fail.** Here a dirty tree, a stale runner version, a first-run
  dialog or a git race can stall a machine; the apps simply don't have those failure
  modes.
- **Built-in extras** — code review, scheduled routines, browser and computer use,
  connectors — come for free and keep improving without me maintaining them.
- **Within the terms by default.** Consumer plans are meant for the account holder, so
  running friends' accounts for my own work may break Anthropic's usage terms — worth
  checking before relying on it. The apps never raise that question.

### Bottom line

The apps are better for working _with_ Claude in one session. This system is better for
_running a queue_ of tasks across several accounts and keeping a durable history of
them. They can be combined: the board and `doc/todo/` stay the source of truth, and the
desktop or mobile app is just another way to open a session.
