> Run with: Sonnet 4.6 / medium
> Machine: mac

# Why after reboot Karel not working?

## Original Requirement

[NEVER REMOVE]

And why even hrdr dowsn't start when I write herdr? Make it after reboot taking tasks from kanban, too.

_From Kanban card `fe0aa900-8e28-4c51-9626-46bbf088895e`._

_GitHub issue #39 — end the commit subject with `(#39)`._

## Investigation & Fix

### Root cause — Karel's `~/.bashrc` PATH was unreachable for non-interactive shells

Karel's `.bashrc` had `export PATH="$HOME/.local/bin:$PATH"` (and `.cargo/env`, `DOCKER_HOST`,
`TESTCONTAINERS_RYUK_PRIVILEGED`) at the **bottom**, **after** the standard interactivity guard:

```bash
case $- in
    *i*) ;;
      *) return;;   # ← non-interactive shells exit here
esac
# ... 100 lines later ...
export PATH="$HOME/.local/bin:$PATH"   # never reached by herdr panes or SSH scripts
```

Herdr panes are non-interactive bash processes.  Inside them, `herdr`, `claude`, etc. were
"command not found" even though the binaries lived in `~/.local/bin`.  After a reboot the
systemd services started fine (linger is enabled, services are enabled), but the first time the
runner launched an agent in a herdr pane, any tool call that relied on those binaries silently
failed.

### Services were already correct

- `loginctl enable-linger krl` ✓
- `herdr-server.service` and `kanban-runner.service` both `enabled` and start at boot ✓
- Runner picks up TODO files within 20 s of boot; no further changes needed there ✓

### Fix applied

Moved the PATH block **before** the interactivity guard in `/home/krl/.bashrc`:

```bash
# PATH and env vars must come before the interactivity guard;
# herdr panes and non-interactive SSH scripts need these set too.
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"
export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"
export TESTCONTAINERS_RYUK_PRIVILEGED=true
# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac
```

Verified: `ssh karel 'which herdr; which claude'` now resolves both without `-l`.

## Results

**Summary** — Found and fixed a PATH ordering bug in Karel's `.bashrc`. The env exports lived
after the early-return guard so non-interactive shells (herdr panes, SSH scripts) never got
`~/.local/bin` in their PATH. Moved all env exports above the guard. Services already started
at boot correctly; no changes to systemd units or launchd plists were needed.

**Files changed**
- `/home/krl/.bashrc` (remote Karel) — moved PATH/DOCKER_HOST/CARGO exports before the
  interactivity guard; backup saved as `.bashrc.bak.20260924_204025`

**Verification**
- `ssh karel 'which herdr; which claude'` — both resolve to `~/.local/bin/` ✓
- Services `herdr-server` and `kanban-runner` running on Karel ✓
- Linger enabled, services enabled — survive reboot ✓

**Deviations** — None
