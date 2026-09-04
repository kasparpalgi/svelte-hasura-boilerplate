> Run with: Sonnet 5 / medium

# Make the runner visible: tmux + herdr notifications

## Original Requirement

[NEVER REMOVE]

From 017: "can't it run the claude code so that I can see how it is working like when I run
it myself manually?" and "I want herdr or claude code webhooks to ding! when claude asks
anything."

The runner currently uses `--dangerously-skip-permissions` (headless). The user wants to:
1. See Claude working (the streaming output)
2. Get notified when attention is needed

## Design

Two modes for the runner, selectable in config:

### Mode A: headless (current default)
- `--dangerously-skip-permissions` — runs unattended, no questions
- Launchd agent, logs to file
- Best for: trusted tasks on well-understood repos

### Mode B: visible + interactive
- Runs in a named tmux session (`kanban-runner`)
- Each task spawns Claude WITHOUT `--dangerously-skip-permissions`
- herdr watches the pane for the permission prompt pattern
- ding! on phone/desktop when Claude asks something
- Best for: new repos, complex tasks, learning what Claude does

**Not a code change in the runner itself** — it's a wrapper script and tmux/herdr config.
The runner already streams stdout, so running it in tmux makes it visible. The only code
change: an optional `--interactive` flag that drops `--dangerously-skip-permissions`.

## Implementation

1. Add `interactive` boolean to `config.json` (default: false for backwards compat)
2. When `interactive: true`, omit `--dangerously-skip-permissions` from the claude args
3. Write a `start-visible.sh` script that launches in a tmux session
4. Document the herdr setup: `herdr watch -p kanban-runner -m "Claude needs input"`

## Verification

- [ ] `interactive: true` runs Claude without `--dangerously-skip-permissions`
- [ ] `interactive: false` (or unset) preserves current behaviour
- [ ] `start-visible.sh` creates a tmux session and runs the daemon in it
- [ ] herdr dings when Claude prompts for permission
