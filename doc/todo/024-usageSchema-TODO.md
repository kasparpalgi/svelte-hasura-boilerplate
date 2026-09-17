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
