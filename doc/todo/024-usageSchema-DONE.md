> Run with: Sonnet 5 / medium

# Hasura schema: Claude usage & pricing (kanban)

## Original Requirement

Foundation for #21 (`021-planOfUsage`). All cards/lists/boards live in the
**`svelte-todo-kanban`** repo's Hasura, so the schema lands there — not in this
boilerplate. Verify against the live kanban Hasura and reload metadata before
claiming done (memory: verify-against-live-instances).

Do this work in `~/Documents/GitHub/svelte-todo-kanban`. Check its tree is clean
and the runner is idle first (memory: runner-blocks-on-dirty-tree).

## Scope

1. **`claude_model_pricing` table** — matches the rows produced by the runner's
   `src/pricing.js` (`mapLitellmPricing`):
   - `model` text PK
   - `input_per_mtok`, `output_per_mtok`, `cache_write_per_mtok`,
     `cache_read_per_mtok` numeric
   - `currency` text default `'USD'`, `source` text, `updated_at` timestamptz default now()
   - select permission: public/all logged-in users (read-only); writes by admin only.

2. **`claude_usage` table** — one row per Claude Code session (idempotent on session):
   - `id` uuid PK default gen_random_uuid()
   - `session_id` text UNIQUE (the transcript's session id — dedupes re-runs)
   - `todo_id` uuid null → `todos.id` (null for non-card runs)
   - `user_id` uuid → `users.id`
   - `repo` text null
   - `model` text (dominant / highest-cost model of the session)
   - `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens` bigint
   - `usage_by_model` jsonb null (per-model breakdown; a session can switch models
     mid-run — the runner drops Opus→Sonnet on a usage wall)
   - `cost_usd` numeric (API-list cost, snapshotted at ingest)
   - `started_at`, `ended_at` timestamptz null, `created_at` timestamptz default now()
   - relationships: `todo` (obj), `user` (obj); on `todos` add `claude_usages` (array)
     so the card can aggregate `claude_usage_aggregate { sum { cost_usd } }`.
   - permissions: user sees rows where `user_id = X-Hasura-User-Id` (and via board
     membership if that's simpler); insert/update by admin (the runner uses the admin secret).

3. **User plan** (per-user, boards inherit — decided for #21):
   - add to `users`: `claude_plan` text null (`api` | `pro` | `max5x` | `max20x`),
     `claude_plan_monthly` numeric null (the real amount the user pays, e.g. 18),
     `claude_plan_currency` text null default `'EUR'`.
   - `null` plan / null monthly = API pay-go → effective cost == API-list cost.
   - self-service update permission on those three columns only.

## Notes

- LiteLLM lags brand-new model ids (no `claude-opus-4-8` row as of 2026-09-17);
  `claude_usage.model` may reference a model absent from `claude_model_pricing`.
  Don't FK `claude_usage.model` → pricing; treat a missing price as cost 0 + flag.
- Migration + metadata via the kanban's hasura CLI; `hasura migrate apply` +
  `hasura metadata apply`; verify tables + a sample aggregate query in the Console.

## Blocks

Tasks 025 (pricing upsert needs the table), 026 (usage capture needs `claude_usage`),
027 (UI reads the aggregates + plan columns).

_From #21 planning. End the commit subject with `(#21)`._

## Results

**Summary** — Added the Claude usage/pricing schema to `svelte-todo-kanban`'s
Hasura (not this repo, per scope): `claude_model_pricing` (LiteLLM-shaped rows,
public read via role `user`), `claude_usage` (per-session token/cost rows,
`session_id` unique, FKs to `todos`/`users`, select restricted to
`user_id = X-Hasura-User-Id`, writes admin-only), and three `claude_plan*`
columns on `users` (self-service update by the owning user). Added
`claude_usages` array relationships on both `todos` and `users`. `model` is
deliberately not FK'd to pricing (brand-new models can lag the LiteLLM list).

**Files changed** (all in `~/Documents/GitHub/svelte-todo-kanban`, commit `9d160c3`):
- Created: `hasura/migrations/default/1801000000000_create_claude_model_pricing/{up,down}.sql`
- Created: `hasura/migrations/default/1802000000000_create_claude_usage/{up,down}.sql`
- Created: `hasura/migrations/default/1803000000000_add_claude_plan_to_users/{up,down}.sql`
- Created: `hasura/metadata/databases/default/tables/public_claude_model_pricing.yaml`
- Created: `hasura/metadata/databases/default/tables/public_claude_usage.yaml`
- Modified: `hasura/metadata/databases/default/tables/tables.yaml` (register 2 new tables)
- Modified: `hasura/metadata/databases/default/tables/public_todos.yaml` (`claude_usages` array rel)
- Modified: `hasura/metadata/databases/default/tables/public_users.yaml` (`claude_usages` array rel,
  `claude_plan`/`claude_plan_monthly`/`claude_plan_currency` in select + update permissions)

**Verification** — Pre-check: `svelte-todo-kanban` tree was clean, runner idle
(confirmed via `hasura-runner.log`). Ran `hasura migrate apply` +
`hasura metadata apply` against the live todzz Hasura
(`https://todzz.admin.servicehost.io`); `hasura metadata ic list` reports
consistent. Live GraphQL checks as admin: `claude_model_pricing { model }`,
`claude_usage_aggregate { aggregate { sum { cost_usd } } }`,
`todos { claude_usages_aggregate { ... } }`, and
`users { claude_plan claude_plan_monthly claude_plan_currency }` all resolve.
Live check as role `user` (`x-hasura-user-id` header): `claude_model_pricing`
and `claude_usage` both selectable and correctly scoped.

**Deviations** — None from the spec. Kept the board-membership select filter
on `claude_usage` simple (`user_id` only), as the task explicitly allowed
("via board membership if that's simpler").
