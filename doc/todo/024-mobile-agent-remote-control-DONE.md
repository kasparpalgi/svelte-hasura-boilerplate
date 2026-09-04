> Run with: Opus 5 / high

# Mobile agent interaction via todzz

PS: with herdr on mobile still getting issue: The app's budndled Herdr Bridge does not support this server CPU architecturer - install it manually. It was tried to be fixed on 023 todo task but I'm still having it.

## Original Requirement

[NEVER REMOVE]

From 021: "I want herdr or something to tell if agent has questions and then interact
from mobile". The user wants to answer agent questions from their phone when Claude
needs permission or clarification.

## The problem

In `--dangerously-skip-permissions` mode, Claude never asks — it just does. In
`--interactive` mode, Claude blocks on stdin waiting for a human in tmux. Neither
mode supports asynchronous mobile interaction.

## Design ideas

### Idea A: Todzz comment thread as the interaction channel

- Agent posts a question as a card comment in todzz
- User replies from mobile (todzz already has mobile comment UI)
- Runner watches for the reply and pipes it to Claude's stdin
- **Hard part:** Claude Code doesn't support async stdin. Would need a custom
  wrapper that pauses Claude, waits for a webhook, then resumes.

### Idea B: Claude Code Remote Control

- Claude Code has built-in Remote Control for phone interaction
- If the runner starts Claude with Remote Control enabled, the user can
  approve/deny from their phone's Claude Code app
- **Research needed:** can Remote Control work with `claude -p` mode?

### Idea C: Accept-all + post-review

- Keep `--dangerously-skip-permissions` (agent never blocks)
- Agent posts what it did as card comments
- User reviews from mobile and can revert/adjust
- Simplest, but no real-time interaction. Kaspar comment:  I heard herdr can make ding on phone and can interact from there https://play.google.com/store/apps/details?id=dev.herdr.mobile&pli=1

## Next step

Research Claude Code Remote Control capabilities (Idea B) — if it works with
the runner, it's the cleanest solution. Otherwise fall back to Idea C with
better card comments (from task 022).

## Research findings

### Idea B wins: Claude Code Remote Control

Claude Code Remote Control is a built-in feature (v2.1.52+; Kaspar has v2.1.260) that
solves the mobile interaction problem natively:

- **Available on all plans** (Pro, Max, Team, Enterprise)
- **Phone interaction**: from the Claude mobile app (iOS/Android) or claude.ai/code,
  approve/deny permissions, send messages, redirect work, monitor subagents
- **Zero config**: outbound HTTPS only, no port forwarding, no SSH, no bridge binaries
- **Survives interruptions**: auto-reconnects after laptop sleep or network drops
- **Multiple modes**:
  - `claude remote-control` — server mode, headless, waits for connections
  - `claude --remote-control` — interactive session + remote access
  - `/remote-control` — enable from an existing session
  - `remoteControlAtStartup: true` — auto-connect every interactive session
- **Runner integration**: `claude remote-control --permission-mode acceptEdits` starts
  a server that accepts file edits but prompts for Bash commands — user approves from phone

### Herdr bridge error (separate issue)

The "bundled Herdr Bridge does not support this server CPU architecture" error comes from
**herdr-web** (the browser/mobile UI), not herdr itself. The herdr-web-bridge is a separate
Rust binary bundled with the release tarball. The bundled binary doesn't match your server's
architecture.

**Fix**: compile herdr-web from source (needs Rust stable + Node.js 22+), or skip it
entirely — Claude Code Remote Control supersedes herdr-web for the "interact from phone"
use case. Herdr remains useful for terminal multiplexing and SSH-based monitoring, but
it's no longer needed for the approval workflow.

### What was already in place

- `inputNeededNotifEnabled: true` — Claude already pushes when it needs input
- `agentPushNotifEnabled: true` — push on agent completion
- Pushbullet notifications from runner (task 023)

## What was done this session

1. **Enabled Remote Control by default**: set `remoteControlAtStartup: true` in
   `~/Documents/CodeNew/claude-config/settings.json` (symlinked to `~/.claude/settings.json`).
   Every new interactive Claude Code session now auto-connects to Remote Control.

2. **Verified existing notification settings**: `inputNeededNotifEnabled` and
   `agentPushNotifEnabled` were already true.

## How to use (from phone)

1. Start a Claude Code session on the Mac (any session — Remote Control is now always on)
2. Open the **Claude mobile app** → tap **Code** in navigation
3. Your Mac's session appears with a green dot → tap to connect
4. Approve/deny permissions, send messages, monitor progress

For the runner specifically:
```bash
claude remote-control --permission-mode acceptEdits --name "Runner"
```
Then connect from phone to approve Bash commands while file edits happen automatically.

## Verification

- [x] Determine if Remote Control works with runner-spawned Claude sessions — **YES**,
  `claude remote-control` is specifically designed for this (server mode)
- [x] Document setup — see "How to use" above
- [ ] Test from phone — **user must do this** (requires Claude mobile app + active session)
- [x] Herdr bridge error diagnosed — herdr-web binary mismatch, not needed for this workflow

## Results

**Summary** — Research complete: Claude Code Remote Control is the solution for mobile
agent interaction. Enabled `remoteControlAtStartup: true` so every session is accessible
from phone. Herdr bridge error diagnosed as herdr-web binary mismatch (separate from
herdr CLI which works fine).

**Files changed:**
- `~/Documents/CodeNew/claude-config/settings.json` — `remoteControlAtStartup: false → true`

**Verification:**
- Research questions answered (3/4 checked, phone test needs user)
- Settings change verified

**Deviations:** None — Idea B (Remote Control) was already the recommended next step
