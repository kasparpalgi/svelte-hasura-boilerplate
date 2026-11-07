> Run with: Sonnet 5.5 / medium

# Live run status on the card

## Original Requirement

[NEVER REMOVE]

Follow-up from #59 (open-source agent Kanban comparison). While a task runs, the card says
nothing until the Results comment lands; you have to open herdr to know anything is happening.
OpenAI Symphony keeps **one persistent "workpad" comment** per issue that the agent edits as it
goes; Lisa posts progress comments; Itervox has a narrative feed.

Build the cheap version in the runner (`klarity-claude-kit/plugins/dev-kit/runner`):

- When a run starts, post **one** card comment, e.g.
  `▶ Running on dell since 14:02 · Opus 5.5 / xhigh · attempt 1`.
- Edit that same comment (by id, `update_comments`) on the events the runner already knows:
  tier step-down on a usage wall, attempt 2, ⏸ needs you, ⚠ did not finish.
- On finish, mark it `■ Finished on dell 14:02–14:41 · $2.33` (cost from `sessionUsage.js`)
  — the Results comment stays separate, as today.
- Add the comment's prefix to the `NOTE` filter in `svelte-todo-kanban`
  `src/lib/server/cardThread.ts`, so the status line is not carried into a re-queued task file.

## Acceptance criteria

- [ ] A started run shows its status comment on the card within one tick.
- [ ] Exactly one status comment per run — edited, never re-posted.
- [ ] Runner tests cover post + edit; the Kanban `cardThread` test covers the new prefix.

_GitHub issue #68 — end the commit subject with `(#68)`._
