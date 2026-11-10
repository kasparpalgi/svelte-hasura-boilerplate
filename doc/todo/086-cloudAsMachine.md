> Run with: Opus 5.5 / high

# "Cloud" as a machine: run a card in a Claude Code cloud session

## Original Requirement

[NEVER REMOVE]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

#85 made runner panes show in the Claude app via Remote Control. The next step is to
let a card run with no machine of ours at all: add **Cloud** to the card's machine
dropdown (todzz.eu, `svelte-todo-kanban`). A runner on the user's own account (Karel or
the Mac) sees `> Machine: cloud` and starts `claude --cloud "/todo NNN"` instead of a
local pane, then watches the task file on origin as usual.

What has to be true first, per `doc/how-it-works.md` → _Cloud session limits_:

- `/todo` and `/verify` must load in the cloud. User plugins don't, so the skills have to
  be in the repo's `.claude/skills/` or enabled on claude.ai. Decide which.
- A cloud session pushes a branch, so a cloud task finishes as a PR (reuse `pr.js`).
- No Hasura or home network in the VM: only repos whose checks run without them qualify.

Acceptance: a test card set to Cloud on this repo ends as a PR with a `-DONE.md`, and
the card links the cloud session.

_GitHub issue #86 — end the commit subject with `(#86)`._
