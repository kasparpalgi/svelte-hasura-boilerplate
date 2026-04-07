# Claude Code Quick-Launch Aliases

Shortcuts to launch Claude Code pre-loaded with workspace context — works on **macOS, Linux, and Windows**.

---

## macOS / Linux Setup

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
alias cs='claude "/prime"'
alias cr='claude --dangerously-skip-permissions "/prime"'
```

Reload your shell:

```bash
source ~/.zshrc   # or ~/.bashrc
```

---

## Windows Setup

### Option A — PowerShell (recommended)

Add to your PowerShell profile (`$PROFILE`):

```powershell
function cs { claude "/prime" @args }
function cr { claude --dangerously-skip-permissions "/prime" @args }
```

Reload your profile:

```powershell
. $PROFILE
```

> If the profile doesn't exist yet: `New-Item -Force -Path $PROFILE`

### Option B — Command Prompt (`cmd`)

Add to a `aliases.cmd` file and call it from `autorun` (via registry), or just run it manually at the start of each session:

```bat
doskey cs=claude "/prime" $*
doskey cr=claude --dangerously-skip-permissions "/prime" $*
```

---

## The Aliases

### `cs` — Claude Safe

```bash
alias cs='claude "/prime"'
```

Starts Claude Code and immediately runs `/prime` to load workspace context. Claude will ask for your approval before running commands, reading files, or making changes.

**Use when:** The task is unfamiliar, touches sensitive files, or you want visibility into what Claude is doing.

---

### `cr` — Claude Run

```bash
alias cr='claude --dangerously-skip-permissions "/prime"'
```

Starts Claude Code with permission prompts disabled, then runs `/prime`. Claude operates autonomously — no approval dialogs.

**Use when:** The task is routine, well-understood, and you want fast iteration without interruptions.

> ⚠️ `--dangerously-skip-permissions` means Claude can read, write, and execute without asking. Use only when you trust the task scope.

---

## Why `/prime` in Both?

`/prime` loads your workspace context — goals, conventions, project structure — so Claude starts oriented rather than cold. Without it, you'd be re-explaining your setup every session.

---

## Available Slash Commands

Once in a session, these commands are available:

| Command | Purpose |
|---------|---------|
| `/prime` | Load project context and summarize current state |
| `/create-plan [request]` | Plan a feature before implementing (saves to `.claude/todo/`) |
| `/implement [plan-path]` | Execute a plan from `.claude/todo/` |

---

## Quick Reference

| Alias | Permissions | Best for |
|-------|-------------|----------|
| `cs`  | Interactive (asks) | Unfamiliar tasks, sensitive work, learning |
| `cr`  | Autonomous (skips) | Trusted tasks, fast iteration, routine work |