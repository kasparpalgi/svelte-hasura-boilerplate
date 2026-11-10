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
   On a machine with `remoteControl` on (Karel, since #85) the same session also opens in
   claude.ai/code and the Claude app, and the card's status line links to it.
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
  without the cloud VM's limits (see [Cloud session limits](#cloud-session-limits)).

### Where the official apps win

- **No setup or upkeep.** No daemons, systemd/launchd units, herdr servers, Pushbullet
  tokens or per-machine plugin installs. About half of the ~90 task files here are
  plumbing (see [Plumbing](#plumbing-and-how-to-cut-it)).
- **Better UI for the session.** Diffs, file trees, artifacts, images and a proper
  chat UI; a herdr pane is a terminal on a small screen (see
  [Better session UI](#a-better-session-ui)).
- **Native notifications and Remote Control** work out of the box and are better
  integrated than Pushbullet + a relay PWA. Since #85 the runner uses Remote Control
  too, but only on machines logged in to your own account.
- **Cloud sessions** run with the laptop closed and don't need a machine of your own.
- **Fewer moving parts to fail.** Here a dirty tree, a stale runner version, a first-run
  dialog or a git race can stall a machine; the apps simply don't have those failure
  modes (see [Fewer stalls](#fewer-stalls)).
- **Built-in extras** — code review, scheduled routines, browser and computer use,
  connectors — come for free and keep improving without me maintaining them.
- **Within the terms by default.** Consumer plans are meant for the account holder, so
  running friends' accounts for my own work may break Anthropic's usage terms — worth
  checking before relying on it. The apps never raise that question.

### Bottom line

The apps are better for working _with_ Claude in one session. This system is better for
_running a queue_ of tasks across several accounts and keeping a durable history of
them. They can be combined: the board and `doc/todo/` stay the source of truth, and the
desktop or mobile app is just another way to open a session (see
[Combining the two](#combining-the-two)).

## Follow-up questions

### Cloud session limits

From the Claude Code docs (code.claude.com, November 2026). A cloud session is a fresh
Ubuntu 24.04 VM with:

- 4 vCPUs, 16 GB RAM and 30 GB disk. Heavy builds or memory-hungry tests can be stopped.
- Docker, PostgreSQL 16 and Redis installed but not running. A setup script that runs in
  under about five minutes is cached as a disk snapshot, but running services are not.
  Hasura has to start again in every session.
- Network set to "Trusted" by default: package registries, GitHub and cloud SDKs only.
  You can change it to None, Full or a custom list. The VM can't reach Karel, Dell, a
  local Hasura or anything else on the home network.
- GitHub only for cloning, pushing and PRs.
- Only what's committed. User-level plugins (so `dev-kit` and `/todo`), `~/.claude/CLAUDE.md`,
  user MCP servers and the memory directory don't come along. Skills have to live in the
  repo's `.claude/` or be enabled on claude.ai.
- Secrets go in as "network secrets" attached to requests by a proxy. Plain environment
  variables are readable by anyone who uses the environment.
- An idle VM pauses after a few minutes and can be reclaimed. History survives, running
  processes don't.
- Usage counts against the account that started it, one account per session.

### Plumbing, and how to cut it

"Plumbing" means tasks that only keep the pipeline running and change no product. In this
repo that's things like 005 dirty working tree, 016 doesn't start, 026 didn't mark done,
039 Karel after reboot, 040/049/050 didn't pick the task, 041 card not moved to Review,
046 false done, 055 renamed repo, 060 worktree deleted, 063/064 not starting and 081
update herdr. Machine setup adds 029, 043–045, 058, 061 and 066. Real features like usage
cost (021–027), the machine picker, live status, screenshots and review checkpoints
(068–073) are the other half.

Ways to cut it:

1. **One setup script per machine** (follow-up 088). Every new machine was its own task
   (Karel, Dell, Windows, Mac). An idempotent `runner/scripts/setup-machine.sh` that
   installs the plugin, herdr, the service units, trust and settings, and ends with
   `--check`, would make that a single command.
2. **Health on the board** (follow-up 087). Each runner reports version, last tick and
   blocked reason to the Kanban. The machine dropdown shows a dot and greys out a machine
   that hasn't ticked for five minutes. "Why didn't it pick up?" becomes a glance, not a
   task.
3. **A smoke test for the runner** (follow-up 089). A fake repo plus a fake `claude` that
   runs one task end to end in `node --test`, so a runner change that breaks pickup fails
   before it ships to four machines.

### A better session UI

1. **Remote Control from the runner — built in #85.** With `"remoteControl": true` in a
   runner's `config.json`, the pane starts as
   `claude --remote-control svelte-hasura-boilerplate-085-see082`. The session also shows
   in claude.ai/code and the Claude app (Code tab) with diffs and a chat UI, and the
   card's status line ends with its `claude.ai/code/session_…` link. herdr stays as the
   fallback. A session only shows in the account its machine is logged in to, so it is
   off by default. It's on for Karel, which turned out to be on your own account. Check
   the others with `claude auth status` before turning it on there. For native push, run
   `/config` once on that machine and turn on _Push when actions required_.
2. **A readable transcript on the card** (follow-up 090). The runner already reads the
   session JSONL for cost. It could also write Claude's messages and the tool names into
   the card's live status comment. That covers the machines on friends' accounts, where
   Remote Control is off, and reads fine on a phone.
3. **Phone-width herdr.** The garbled text happens when a wide pane is squeezed onto a
   phone. A pane width that matches the phone, or a reflowed view, fixes it (see 081).

### Fewer stalls

The runner already handles a lot: it stashes dirt, self-updates, pre-answers the trust
dialog, claims cards with compare-and-swap and skips a task after two failed attempts.
What's left:

1. **Always use a worktree — built in #91.** Every task now runs in
   `~/.kanban-runner/worktrees/<repo>/<stem>`, not only in pull-request repos. A
   push-to-main repo's task runs on a `run/<stem>` branch that tracks `origin/main`, and
   the runner lands its commits on `main` from there. No agent touches the main checkout
   any more, so a run that ends dirty no longer blocks the next task. Each worktree is
   removed when its run ends, and a sweep every tick clears any that were left behind,
   along with their branches and trust entries.
2. **Refuse to run when stale** (part of 087). A runner whose version is behind the newest
   one on the board skips work and says so, instead of running old code.
3. The setup script and health dot from [Plumbing](#plumbing-and-how-to-cut-it) cover
   first-run dialogs and silent stalls.

### Combining the two

The task file holds everything a session needs, so any surface can run it:

1. **Board starts, app watches — built in #85.** Remote Control as above. The runner
   keeps the queue, and the Claude app is the window.
2. **"Cloud" as a machine** (follow-up 086). Add Cloud to the machine dropdown. A runner
   on your own account sees `> Machine: cloud` and runs `claude --cloud "/todo 82"`. For
   that to work `/todo` must be in the repo's `.claude/skills/` (plugins don't load in the
   cloud), and the session pushes a branch, so it ships as a PR, not straight to main.
3. **By hand.** Open the desktop app or `claude` in the repo and type `/todo 82`. This
   works today. Do it while the file is still a draft (`082-slug.md`), so the runner
   doesn't pick up the same task.
4. **The other direction.** In any app session, `/plan <request>` writes a new task file,
   so an idea from the phone joins the queue.
