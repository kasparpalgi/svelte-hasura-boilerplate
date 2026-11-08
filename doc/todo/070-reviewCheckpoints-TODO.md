> Run with: Opus 5.5 / high

# Review checkpoints: acceptance criteria and plan-first

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Review checkpoints: acceptance criteria and plan-first

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. Backlog.md (7k★) builds agent work around three human checkpoints — **spec, plan, code** — and gives every task acceptance criteria plus a Definition of Done. Lisa checks the acceptance criteria before it opens a PR; Camelot and Archon stop for plan approval before writing code. We have the spec checkpoint (`/plan` → draft → TODO) and the code checkpoint (Review), but nothing in between, and no criteria to check against.

1. **Acceptance criteria** (dev-kit skills only): `/plan` writes an `## Acceptance criteria`checklist into every task file it makes; `/todo` ticks each one in `## Results` with the evidence (test name, command output, screenshot), or says why not.
2. **Plan first** (opt-in per card): a `> Plan first` line under `> Run with:` (a card checkbox in todzz writes it, as the model and machine fields do). `/todo` then writes `## Plan` and ends `-BLOCKED` with "approve the plan". The human comments and moves the card back; since svelte-todo-kanban 0.23.0 those comments reach the agent in `## Card comments`, and the second run builds.

## Acceptance criteria

- [ ] `/plan` output has an acceptance-criteria checklist; `/todo` Results address each item.
- [ ] A `> Plan first` card ends its first run BLOCKED with a plan and no code changes.
- [ ] Re-queued, it builds the approved plan, taking the review comments into account.

*GitHub issue #70 — end the commit subject with* `(#70)`*.*

_From Kanban card `2b7115e6-83c9-456a-b521-2c9ab6586192`, moved to the agent list._

_GitHub issue #70 — end the commit subject with `(#70)`._
