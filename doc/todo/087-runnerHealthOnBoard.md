> Run with: Opus 5.5 / high

# Runner health on the board

## Original Requirement

[NEVER REMOVE]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

"Why didn't it pick up?" was the most common plumbing task (005, 016, 039, 040, 049,
050, 063, 064). Make it a glance instead:

- Each runner reports `machine`, runner version (git HEAD), last tick time and its current
  blocked reason (`state.json`) to the Kanban every tick or two.
- The card's machine dropdown shows a dot per machine: green when it ticked in the last
  5 minutes, grey and unselectable otherwise, with the blocked reason as a tooltip.
- A runner whose HEAD is behind the newest HEAD another runner reported says so in its
  log and on the dot, instead of running old code quietly.

Needs a small Hasura table + permissions (`svelte-todo-kanban`) and a write in the runner.
Acceptance: stopping one runner turns its dot grey within 5 minutes.
