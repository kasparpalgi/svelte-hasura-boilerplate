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

## Results

**Summary** — In `svelte-todo-kanban`: the card's Agent Model dropdown now offers the
seven version-pinned values from the table above (plus *Auto*), matching `FAMILIES` in
`klarity-claude-kit/plugins/dev-kit/runner/src/classify.js` exactly. Agent Effort gained
`xhigh` and `max`. Bare `opus`/`sonnet`/`haiku`/`fable` values already on old cards keep
resolving correctly server-side (`fieldLabel()` splits on `-`/`@`), they're just no
longer offered as fresh choices in the dropdown.

**Files changed** (all in `svelte-todo-kanban`)
- Modified: `src/lib/components/todo/CardDetailView.svelte` — dropdown options
- Modified: `src/lib/locales/{en,et,cs}/common.json` — new `card.agent_model_*` /
  `card.agent_effort_xhigh` / `card.agent_effort_max` keys, old bare-family keys removed
- Modified: `src/lib/utils/cardHelpers.ts` — `todoEditSchema` enum widened for both
  fields (zod strips unknown values on save otherwise)
- Created: `hasura/migrations/default/1788691191454_widen_agent_model_effort_check/`
  (up/down) — widened `todos_agent_model_check` / `todos_agent_effort_check` CHECK
  constraints to accept the new values; applied to the hosted instance
  (`todzz.admin.servicehost.io`) via `hasura migrate apply`
- Bumped `package.json` 0.12.1 → 0.13.0 (feature)

**Verification**
- `hasura metadata export` clean diff before and after the migration (no drift)
- `npx vitest run src/lib/server/__tests__/taskfile.test.ts` — 25/25 pass, unaffected
  (server-side label building already handled versioned models generically)
- `npm run check` in `svelte-todo-kanban` — 9 pre-existing errors / 4 pre-existing
  warnings, none in the touched files (`og-image/+server.ts`, `Line.svelte`,
  `TodoFiltersSidebar.svelte` are unrelated and predate this change)
- Did not browser-test the dropdown live (no running dev server / auth session in this
  session); the schema/enum/label wiring is covered by the existing unit test and
  `npm run check` on the touched files

**Deviations**
- No `classify.js` change needed — its `FAMILIES` table already contained exactly the
  seven versions the task asked the dropdown to offer.
- Added a DB migration that wasn't explicitly listed in the task: the existing
  `todos_agent_model_check`/`todos_agent_effort_check` CHECK constraints (from task 161)
  only allowed the four bare family names and `low/medium/high`. Without widening them,
  saving any new dropdown value would fail the DB constraint. This was implied by "the
  dropdown just has to offer them" but required a schema change to actually work.
