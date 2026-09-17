> Run with: Opus 4.8 / high

# Plan: % of usage

## Original Requirement

[NEVER REMOVE]

1. After each session get token usage. Also we know the model.
2. From there we get the token pricing. Must have once per few each days check pricing and save in hasura.
3. Each project shall have option to select what plan it has - can we then know the real cost as if you pay €18 per month then how to know how much cheaper every spent token is?
4. Then we shall store that real price on the card and see it + see below the list total for that list

Ask questions and only plan this session + create followup todo tasks

_From Kanban card `b30bef4e-203a-464f-a098-ce6235312490`._

_GitHub issue #21 — end the commit subject with `(#21)`._

---

## Results

**Summary** — Planned end-to-end Claude-usage cost tracking across three repos and
built the pricing foundation. This spans the **runner** (`klarity-claude-kit`, which
drives `claude -p "/todo N"` per card), the **kanban** (`svelte-todo-kanban`, which
owns cards/lists/boards + a Claude usage/pricing schema), and this boilerplate (the
planning hub). Answered the four design forks and split the rest into 024–027.

**Decisions (the four forks)**
1. _Usage capture_ — read the session transcript JSONL after each run and sum
   per-message `usage` by model. Works for both the headless and herdr paths and
   keeps the live text stream (needed for usage-limit detection) intact.
2. _Cost shown_ — **both**: a stable API-list cost per card (`tokens × price`), plus
   a plan-effective cost = subscription ÷ period usage ("effective X% of list"),
   final at period close.
3. _Pricing source_ — scheduled fetch of LiteLLM's public price list, filtered to
   Claude chat models, upserted into Hasura every few days.
4. _Plan scope_ — per **user** (one Claude subscription per person); boards inherit.

**Answer to requirement #3** ("how much cheaper is every spent token"): under a flat
plan the marginal per-token price is the subscription amortized over actual usage —
`effectiveRatio = monthly ÷ (period's total API-list cost)`. Every token effectively
cost `ratio ×` its list price; `api`/no plan → ratio = 1. Detailed in 027.

**Slice built this session** (in `klarity-claude-kit/plugins/dev-kit/runner`):
- `src/pricing.js` — `mapLitellmPricing()` + `fetchClaudePricing()`: pure, converts
  per-token → per-Mtok, keeps only Anthropic Claude chat models, fills missing cache
  prices (write→input, read→input/10).
- `test/pricing.test.js` — 5 tests, all green.
- `scripts/fetch-claude-pricing.mjs` — dry-run CLI; verified live (28 Claude models).
  Confirmed LiteLLM lags new ids (no `claude-opus-4-8` yet) → capture must tolerate a
  missing price (noted in 026).

**Follow-ups created**
- `024-usageSchema-TODO.md` (Sonnet 5) — Hasura `claude_model_pricing` + `claude_usage`
  tables and `users.claude_plan*` columns (kanban). Blocks 025–027.
- `025-pricingUpsert-TODO.md` (Sonnet 5) — DB upsert + ~3-day schedule (runner).
- `026-captureSessionUsage-TODO.md` (Opus 5) — read transcript JSONL, cost it, upsert a
  `claude_usage` row in `closeLoop` (runner). The run→transcript mapping is the hard part.
- `027-usageUi-TODO.md` (Sonnet 5) — plan setting + per-card/per-list cost + plan-effective (kanban).

**Files changed**
- created: `doc/todo/024..027-*-TODO.md`
- created (klarity-claude-kit): `runner/src/pricing.js`, `runner/test/pricing.test.js`,
  `runner/scripts/fetch-claude-pricing.mjs`
- renamed: `021-planOfUsage-TODO.md` → `-DONE.md`

**Verification** — `node --test test/*.test.js` in the runner: 47/47 pass (5 new).
Live `fetch-claude-pricing.mjs` returns 28 Claude models with correct per-Mtok prices.

**Deviations** — Kept the DB upsert/migrations out of this slice on purpose: the
`claude_model_pricing` table doesn't exist yet, and pricing must be verified against
the live kanban Hasura (memory: verify-against-live-instances). It lands in 024/025.
