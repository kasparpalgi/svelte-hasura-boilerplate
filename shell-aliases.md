# Claude Code Quick-Launch Aliases

Shortcut to launch Claude Code in YOLO mode and start a specific task — eg. run `cy 012` to execute task 012 from `.claude/todo/` — works on **macOS, Linux, and Windows**.

---

## macOS / Linux Setup

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
cy() { claude --dangerously-skip-permissions "/todo $1"; }
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
function cy { claude --dangerously-skip-permissions "/todo $args" }
```

Reload your profile:

```powershell
. $PROFILE
```

> If the profile doesn't exist yet: `New-Item -Force -Path $PROFILE`

### Option B — Command Prompt (`cmd`)

Add to a `aliases.cmd` file and call it from `autorun` (via registry), or run it manually at the start of each session:

```bat
doskey cy=claude --dangerously-skip-permissions "/todo $1"
```

---

## The `cy` Alias

Starts Claude Code in YOLO mode and immediately runs `/todo <number>`, loading and executing the matching task file from `.claude/todo/`.

**Usage:** `cy 020`

> ⚠️ `--dangerously-skip-permissions` means Claude can read, write, and execute without asking. Use only when you trust the task scope.

---

## Available Slash Commands

| Command | Purpose |
|---------|---------|
| `/todo [number]` | Open and execute a task from `.claude/todo/` by number |
| `/create-plan [request]` | Plan a feature before implementing (saves to `.claude/todo/`) |
| `/implement [plan-path]` | Execute a plan from `.claude/todo/` |