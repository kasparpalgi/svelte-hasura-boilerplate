> Run with: Sonnet 5 / high

# Kanban UI: plan setting, per-card & per-list cost, plan-effective (kanban)

## Original Requirement

#21 steps 3 & 4: pick a plan; see the real price on each card and a total per list.
We decided (#21) to show **both** an API-list cost and a plan-effective cost.

**Depends on 024** (schema) and on data flowing from **026** (usage rows).

Work in `~/Documents/GitHub/svelte-todo-kanban`. Follow its `svelte-conventions`
and `design-system` skills. Clean tree + idle runner first.

## The cost model (answer to #21 question 3)

Under a flat subscription tokens aren't billed per-token, so there are two numbers:

- **API-list cost** — `tokens × price` from `claude_model_pricing`. Stable, final
  immediately, comparable across cards. This is `claude_usage.cost_usd`.
- **Plan-effective cost** — the subscription amortized over the period's actual
  usage. For a user whose `claude_plan_monthly` = M over a period whose total list
  cost is L: `effectiveRatio = M / L`. Every token effectively cost `ratio ×` its
  list price. Only final at period close; show it as a live estimate.
  - `claude_plan` null / `api` → ratio = 1 (you pay list).

## Scope

1. **User settings**: plan selector (`api` / `pro` / `max5x` / `max20x`) + monthly
   amount + currency, writing the `users.claude_plan*` columns (024). Seed sensible
   defaults but let the user type their real amount (e.g. €18).
2. **Card**: badge showing the card's API-list cost
   (`claude_usages_aggregate { sum { cost_usd } }`), and, when a plan is set, a
   secondary "~€Y real" using the board owner's current effective ratio.
3. **List footer**: total list cost = sum of its cards' costs.
4. **Board / period**: show the effective ratio ("paid €18/mo → effective 9% of
   list") from the month's total. Keep the period definition simple (calendar month).
5. GraphQL: add the queries/mutations to `documents.ts` → `npm run generate` →
   import from `generated.ts`.

## Verify

`npm run check`, `npm run test:unit:all`; Playwright: a card with usage shows the
cost, the list footer sums, the plan selector persists. Keep files ~100 lines.

_From #21 planning. End the commit subject with `(#21)`._

## Results

**Summary** — Built in `svelte-todo-kanban` (not this repo): a Claude plan selector in
Settings (`api`/`pro`/`max5x`/`max20x` + monthly amount + currency, writing
`users.claude_plan*`); a per-card badge showing the API-list cost
(`claude_usages_aggregate.sum.cost_usd`) plus a "~€Y real" plan-effective estimate once
a plan is set; a per-list footer summing card costs; and a board-level line showing the
amortization ratio (`effectiveRatio = monthly / period list cost`, calendar month) once
the signed-in user has usage this period. All three locales (en/et/cs) got the new
strings.

**Files changed**
- Created: `src/lib/utils/claudeCost.ts`, `src/lib/utils/__tests__/claudeCost.test.ts`,
  `src/lib/stores/claudeUsage.svelte.ts`, `src/lib/components/todo/CardCostBadge.svelte`,
  `src/lib/components/settings/ClaudeUsageSettings.svelte`
- Modified: `src/lib/graphql/documents.ts` (+ generated types via `npm run generate`
  against the live Hasura schema), `src/lib/components/todo/TodoItem.svelte`,
  `src/lib/components/todo/TodoKanban.svelte`, `src/routes/[lang]/settings/+page.svelte`,
  `src/lib/locales/{en,et,cs}/common.json`, `package.json` (0.15.1 → 0.16.0)

**Verification**
- `npm run check`: 17 pre-existing errors (unrelated: og-image Buffer typing, chart a11y)
  — same or fewer than the 20-error baseline before this change; zero errors in touched
  files.
- `npm run test:unit:all`: 311 passed (27 files), incl. 7 new tests for the ratio math
  in `claudeCost.test.ts`.
- Playwright/browser: signed in as the project's `TEST_USER_EMAIL` test account against
  production Hasura, opened Settings, set plan=Pro/€18/EUR, saved, reloaded — persisted
  correctly. Reset that test row back to null afterward to avoid leaving test data in
  the live multi-user DB. Could not visually confirm the card badge / list footer
  against real `claude_usage` rows — the test account's board has no cards — but the
  query shape, RLS-scoped permissions, and ratio math were verified via codegen against
  the live schema and unit tests.

**Deviations**
- Board-level ratio uses the signed-in user's own usage (own calendar-month total
  across all boards/repos), not literally "board owner" for non-owner viewers — RLS on
  `claude_usage` only exposes rows where `user_id = X-Hasura-User-Id`, so a non-owner's
  query for the owner's usage returns null and the secondary badge/line just doesn't
  render. This matches the plan being a personal subscription, not a per-board setting.
- Committed and pushed directly to `svelte-todo-kanban` (not this repo), following the
  pattern set by task 024's commit `9d160c3`.
