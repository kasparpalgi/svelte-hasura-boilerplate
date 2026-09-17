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
