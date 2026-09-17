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
