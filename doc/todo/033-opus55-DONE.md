> Run with: Sonnet 4.6 / medium
> Machine: mac

# Opus 5.5

## Original Requirement

[NEVER REMOVE]

Not sure it needs to be added also anywhere else but to the Kanban board's card dropdown menu Opus 5.5 needs to be added for sure.

_From Kanban card `3302501d-3121-479b-9b07-a347b6520239`._

_GitHub issue #33 — end the commit subject with `(#33)`._

## Results

**Summary** — Added `opus-5.5` option to the card model dropdown in svelte-todo-kanban.

**Files changed** (in `svelte-todo-kanban`):
- `src/lib/utils/cardHelpers.ts` — added `'opus-5.5'` to zod enum
- `src/lib/components/todo/CardDetailView.svelte` — added dropdown option
- `src/lib/locales/en/common.json`, `cs/common.json`, `et/common.json` — added `agent_model_opus_5_5` i18n key
- `package.json` — bumped 0.17.1 → 0.17.2

**Verification** — taskfile tests (55/55 pass), write-task-file tests (10/10 pass); pre-existing type errors unrelated to this change.

**Deviations** — None
