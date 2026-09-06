> Run with: Sonnet 5 / medium

# Card model dropdown needs versions and the full effort range

## Original Requirement

[NEVER REMOVE]

Split out of task-028 (item 1). The runner now honours a pinned version end to end —
`> Run with: Sonnet 4.6 / low` really starts `claude --model claude-sonnet-4-6`. The
board cannot express that yet: the card's Agent Model dropdown offers families only
(`fable`, `opus`, `sonnet`, `haiku`) and Agent Effort stops at `high`.

## What to build

In `svelte-todo-kanban`:

1. **Model options** become version-pinned values. `src/lib/server/taskfile.ts` already
   parses them — `fieldLabel()` splits `agent_model` on `-` or `@`, so `sonnet-4.6` and
   `opus-4.8` work today with no server change. The dropdown just has to offer them:

   | Value        | Label      |
   | ------------ | ---------- |
   | *(null)*     | Auto       |
   | `fable-5.1`  | Fable 5.1  |
   | `opus-5`     | Opus 5     |
   | `opus-4.8`   | Opus 4.8   |
   | `opus-4.6`   | Opus 4.6   |
   | `sonnet-5`   | Sonnet 5   |
   | `sonnet-4.6` | Sonnet 4.6 |
   | `haiku-4.5`  | Haiku 4.5  |

   Keep bare `opus`/`sonnet`/`haiku` working — existing cards store those, and they mean
   "that family's latest".

2. **Effort options** gain `xhigh` and `max` (the CLI accepts low, medium, high, xhigh,
   max). Add the locale keys in every `src/lib/locales/*/common.json` that already has
   `agent_effort_low/medium/high` — en, et, cs and any others.

3. The dropdown lives near `161-cardModelDropdown-DONE.md`'s work; find it with
   `grep -rn "agent_model_auto" src/`.

## Notes

- The single source of truth for which versions exist is `FAMILIES` in the runner's
  `plugins/dev-kit/runner/src/classify.js`. If a version is offered on the board but is
  not in that table, the runner falls back to the family's latest — no crash, but the
  card silently lies. Keep the two lists in step.
- Fable bills usage credits; it is fine to offer but should not be the default.
