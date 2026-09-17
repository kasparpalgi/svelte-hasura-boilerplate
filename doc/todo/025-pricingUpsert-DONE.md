> Run with: Sonnet 5 / medium

# Scheduled Claude pricing upsert (runner)

## Original Requirement

#21 step 2: "once per few days check pricing and save in Hasura." The pure fetch +
mapping already exists — built in the #21 planning slice as
`klarity-claude-kit/plugins/dev-kit/runner/src/pricing.js` (`fetchClaudePricing`,
`mapLitellmPricing`) with `test/pricing.test.js` and a dry-run CLI
`scripts/fetch-claude-pricing.mjs`. This task adds the DB upsert and the schedule.

**Depends on 024** (the `claude_model_pricing` table must exist first).

Work in `~/Documents/GitHub/klarity-claude-kit`. Clean tree + idle runner first.

## Scope

1. `src/pricing.js`: add `upsertPricing(kanban, rows, gqlFn)` — an
   `insert_claude_model_pricing` with `on_conflict` on `model` updating all price
   columns + `updated_at`. Reuse the same `gql`/Hasura-creds pattern as `kanban.js`
   (endpoint + admin secret from config). Inject `gqlFn` for a unit test.
2. `scripts/fetch-claude-pricing.mjs`: keep `--dry-run` (print only); default run
   fetches → maps → upserts using the runner config's `endpoint`/`adminSecret`.
   Log "upserted N models".
3. Schedule every ~3 days. Prefer a tiny launchd plist alongside the existing
   `launchd.plist.example`, OR document a `/schedule` cloud routine. One source of
   truth — don't run it twice.
4. Bump runner `package.json` version (MINOR).

## Verify

`node --test`; `node scripts/fetch-claude-pricing.mjs` against the live kanban
Hasura → confirm rows land (memory: verify-against-live-instances); re-run → row
count stable (upsert, not duplicate).

_From #21 planning. End the commit subject with `(#21)`._

## Results

**Summary** — Added `upsertPricing(kanban, rows, gqlFn)` to `src/pricing.js`, an
`insert_claude_model_pricing` mutation with `on_conflict` on the `model` PK
(`claude_model_pricing_pkey`) updating all price columns, `currency`, `source`, and a
fresh `updated_at`. Wired `scripts/fetch-claude-pricing.mjs` to fetch → map → upsert
by default, keeping `--dry-run` for a print-only preview. Added a launchd plist for a
~3-day schedule (`StartInterval`, since launchd has no native "every N days" trigger)
alongside the existing task-runner one, plus a README section documenting it —
one source of truth: it reuses the runner's own `config.json` credentials, no separate
schedule mechanism.

**Files changed** (all in `~/Documents/GitHub/klarity-claude-kit`,
`plugins/dev-kit/runner/`):
- Modified: `src/pricing.js` (added `upsertPricing` + its `defaultGql`)
- Modified: `scripts/fetch-claude-pricing.mjs` (default run now upserts; `--dry-run`
  keeps the old print behavior)
- Modified: `test/pricing.test.js` (2 new tests for `upsertPricing`)
- Created: `launchd-pricing.plist.example`
- Modified: `README.md` (new "Claude pricing sync (launchd)" section)
- Modified: `package.json` (0.12.0 → 0.13.0, MINOR)

**Verification** — Clean tree + idle-runner check before starting (this task itself
ran under the runner, tree was clean). `node --test`: 49/49 pass. Live check against
`https://todzz.admin.servicehost.io` (memory: verify-against-live-instances):
`node scripts/fetch-claude-pricing.mjs --dry-run` printed 28 Claude models;
`node scripts/fetch-claude-pricing.mjs` reported "upserted 28 models" and a live
GraphQL query confirmed 28 rows with fresh `updated_at` timestamps; re-running it a
second time kept the count at 28 (upsert, not duplicate) and advanced `updated_at`
again.

**Deviations** — None from the spec.
