> Run with: Opus 5.5 / high
> Machine: dell

# Stop a running task when its card leaves the agent list

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Stop a running task when its card leaves the agent list

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. Since #51, dragging a card out of the agent list renames its `-TODO.md`back to a draft, but only a task that has not started yet. A run already in its pane keeps going, then commits and moves the card to Review anyway. Symphony reconciles every tick: an issue that leaves the active states has its agent stopped. Itervox pauses on the same signal.

- While a task's pane is live, the runner checks on its normal poll whether origin still has the `-TODO.md` (a fetch, not a pull). If the file went back to a draft or was deleted, it stops the pane, parks the work in a stash as "⚠ did not finish" does, and sends `Runner ⏹ stopped — card left the agent list`.
- Find out first whether the tick loop can check while a run is in progress, or whether `herdr.js` blocks it.

## Acceptance criteria

- [ ] Moving a running card to Backlog stops its agent within one poll, with the work stashed.
- [ ] Moving it back re-queues it normally.

*GitHub issue #73 — end the commit subject with* `(#73)`*.*

_From Kanban card `e3f773f4-b814-4b3b-b434-1e68025ff27a`, moved to the agent list._

_GitHub issue #73 — end the commit subject with `(#73)`._
