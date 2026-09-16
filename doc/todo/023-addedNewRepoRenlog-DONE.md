# Added new repo (renlog) to config and moved card to Todo but it is not executed

## Original Requirement

[NEVER REMOVE]

This one started

_From Kanban card `9734c526-1c3d-4ca9-af1b-fe4155c23e96`._

## Results

**Summary** — Card describes a runner onboarding gap: after adding the `renlog`
repo (`armstrong-audio/renlog-metsa`) to the kanban-runner's `config.json` and moving
its Kanban card to Todo, nothing executed. Investigated the pipeline end to end:

- `write-task-file` (svelte-todo-kanban) creates the task file straight in the
  card's own repo via the GitHub API, keyed off `board.github` — independent of the
  runner's `config.json`.
- The local runner (`klarity-claude-kit/plugins/dev-kit/runner`) only executes a
  task file once that repo's local clone is registered in `repos` in `config.json`
  — until then, a TODO file can exist on GitHub with no local process watching it.
- `config.json` is reloaded every poll tick (`run.js`), so adding the repo entry
  does *not* require a runner restart — the very next tick picks it up.
- Confirmed the fix already took effect: once `renlog-metsa` was added to
  `config.json`, the runner picked up, ran, and closed out a separate renlog task
  (`.claude/todo/159-kaardiVRvigradientOstuvihje-DONE.md`, committed
  `afa64c7` today) end-to-end, including the git pull/rebase/push preflight.
- This specific card (`9734c526…`) never got a task file of its own inside
  `renlog-metsa` — it lives on the **Boilerplate** board
  (`kasparpalgi/svelte-hasura-boilerplate`), so `write-task-file` correctly wrote
  it here as `doc/todo/023-addedNewRepoRenlog-TODO.md` rather than into renlog.
- Two earlier automated passes at this file only edited the `Original Requirement`
  text (a rule violation — that section must never be rewritten) without doing any
  investigation, which is why `queue.js`'s stuck-task logic (2 tries, no `-DONE`)
  would have skipped it going forward.

**Root cause** — no code bug: adding a new repo to the runner requires a one-time
manual `config.json` edit (repo path), which had not happened yet when the card was
first moved to Todo. Once added, the existing reload-on-each-tick logic works as
designed.

**Files changed** — None in this repo; no fix needed beyond the `config.json` entry
that was already made. Investigation only.

**Verification** — Confirmed live: `renlog-metsa`'s runner pipeline completed a
real task (#159) after the config change, using the same preflight/pull/execute/
close-loop path this card was stuck on.

**Deviations** — None. No code change was warranted; closing as resolved rather
than filing a follow-up.
