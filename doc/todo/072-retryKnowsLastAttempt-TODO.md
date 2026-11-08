> Run with: Opus 5.5 / high
> Machine: dell

# A retry knows why the last attempt failed

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# A retry knows why the last attempt failed

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. When a run ends with a dirty tree, the runner stashes the work ("⚠ did not finish") and attempt 2 starts from a clean tree knowing nothing about attempt 1. Symphony passes `attempt` into the prompt ("resume from the current workspace state, do not repeat finished investigation"). Lisa injects past failures into the next prompt as guardrails.

- On attempt 2, the prompt says how attempt 1 ended: the reason (dirty paths, stuck, usage wall), the stash ref holding its work, and the `NNN-slug.log` path.
- Constraint: do **not** write this into the task file. Editing it resets the attempt count, and the run would loop forever. It belongs in the prompt (`/todo NNN` arguments, or the herdr prompt text). Check how `/todo` treats extra arguments first.

## Acceptance criteria

- [ ] Attempt 2's prompt names attempt 1's ending and stash ref; attempt 1's prompt is unchanged.
- [ ] Runner test covers both prompts.

*GitHub issue #72 — end the commit subject with* `(#72)`*.*

_From Kanban card `c2928d46-8ad1-447d-8837-74a2e8233432`, moved to the agent list._

_GitHub issue #72 — end the commit subject with `(#72)`._
