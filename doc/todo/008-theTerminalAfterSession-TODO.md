> Run with: Opus 4.8 / medium

# Dont close the terminal after session has finished maybe I want to write something follow up I will close myself

## Original Requirement

[NEVER REMOVE]

Note also that manually run /todo session going on at ezy-iot repo - don't make that one interrupt.

_From Kanban card `5629a410-8d8c-42eb-b7c1-1fd0d5742b35`._

_GitHub issue #8 — end the commit subject with `(#8)`._

## Results

**Summary** — Investigated why an automated `/todo` terminal pane closes as soon as the
session finishes. This is **not** a `svelte-hasura-boilerplate` bug and cannot be fixed from
this repo — the auto-close is done by the **todzz Kanban runner** that orchestrates the
session, which lives in a separate repository.

**Root cause (confirmed)**

- Process tree of a live automated session:
  `herdr server → -zsh (interactive login shell) → claude … /todo NNN`.
  The pane's child is a normal **interactive** login shell; claude runs *inside* it.
- `herdr agent start` documents that it runs the agent in "an existing pane **at an
  interactive shell prompt**". When the agent process exits, the pane simply returns to that
  shell prompt — **herdr does not close the pane itself.**
- `~/.config/herdr/herdr-server.log` shows the pane's child (`-zsh`) exiting right after the
  claude agent completes (`event="pane.exit" outcome="completed"`), and in at least one case an
  explicit `method="pane.close"` API call. That means an **external orchestrator sends `exit`
  to the shell / calls `herdr pane close`** once it detects the agent finished.
- herdr config-reference (v0.8.2) has **no** key for pane linger / keep-open-on-agent-exit
  (checked `close`, `linger`, `persist`, `exit`, `hold`, `remain`). So the behaviour is owned
  entirely by the caller, i.e. the todzz runner — not herdr, not this repo, not the `dev-kit`
  plugin.

**Where the real fix belongs (todzz runner repo)** — after `herdr agent start … /todo NNN`
returns/completes, the runner should **stop auto-closing the pane**: don't send `exit` and
don't call `herdr pane close`. The pane will naturally sit at the interactive `-zsh` prompt in
the task's working directory, so the human can type a follow-up and close it themselves — which
is exactly the request. (Optionally: keep an auto-close only for panes that exited non-zero, or
gate it behind a "keep panes open" preference.)

**Manual `cy` launcher (separate, optional)** — the manual convenience function in `~/.zshrc`,
`cy() { claude --dangerously-skip-permissions "/todo $1"; }`, returns to the prompt on its own
and does **not** close the pane, so it already behaves as desired. The automated runner does not
use `cy` (the live process shows runner-injected `--model … --effort …` flags that `cy` never
passes), so editing `cy` would not address the reported behaviour.

**Files changed** — this task file only (findings). No source changed in this repo.

**Verification** — n/a (no code change here). Findings verified against the live process tree
(`ps`), `herdr agent start --help`, and the herdr v0.8.2 config reference.

**Deviations** — Task cannot be completed in this repo; the fix must land in the todzz Kanban
runner. Left as `-TODO` for a human to apply there.
