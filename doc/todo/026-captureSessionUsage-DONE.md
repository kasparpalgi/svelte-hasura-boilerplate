> Run with: Opus 5 / high

# Capture per-session Claude token usage in the runner

## Original Requirement

#21 step 1: "After each session get token usage. Also we know the model." The
runner (`klarity-claude-kit/plugins/dev-kit/runner`) runs `claude -p "/todo N"`
(headless) or in a herdr tmux pane, and currently keeps only plain text. We decided
(#21) to read the **session transcript JSONL after the run** — works for both paths
and keeps the live text stream intact for usage-limit detection.

**Depends on 024** (`claude_usage` table + `claude_model_pricing`).

Work in `~/Documents/GitHub/klarity-claude-kit`. Clean tree + idle runner first.

## The hard part — mapping a run to its session transcript

Claude Code writes `~/.claude/projects/<cwd-slug>/<session-id>.jsonl`, where
`<cwd-slug>` is the repo path with `/` (and `.`) → `-`. Plan:

1. Record `runStartMs = Date.now()` right before spawning claude (in `run.js`).
2. After the run, list `*.jsonl` in the slug dir with `mtime >= runStartMs`; if
   several, pick the one whose last line's timestamp is latest. `session-id` = the
   filename stem.
3. Parse each JSONL line; for assistant messages sum `message.usage`
   (`input_tokens`, `output_tokens`, `cache_read_input_tokens`,
   `cache_creation_input_tokens`) grouped by `message.model`. A session can span
   models (Opus→Sonnet on a usage wall) → build `usage_by_model`; dominant model =
   highest cost.
4. Cost with `claude_model_pricing` (fetch once). A model absent from pricing
   (LiteLLM lags new ids — no `claude-opus-4-8` yet) → cost 0 for that slice + log a
   warning; never crash.

Keep the slug derivation in a pure, tested helper — verify it against a real path
under `~/.claude/projects/`.

## Wire-in

- New `src/sessionUsage.js`: `slugFor(path)`, `findSessionFile(dir, sinceMs)`,
  `sumUsage(lines)`, `costOf(byModel, pricing)`.
- In `closeLoop` (`kanban.js`): after moving the card, upsert one `claude_usage`
  row (idempotent on `session_id`) with `todo_id` = the card, `user_id` =
  `board.user_id`, `repo`, tokens, `usage_by_model`, `cost_usd`, timestamps.
- Non-card / hand-written runs: still record the row with `todo_id = null`.
- Unit tests with fixture JSONL lines (multi-model, missing-price, no-transcript).
- Bump runner `package.json` (MINOR).

## Verify

`node --test`; one real `/todo` run end-to-end → a `claude_usage` row appears with
sane tokens/cost; a second run of the same task does not duplicate it.

_From #21 planning. End the commit subject with `(#21)`._

## Results

**Summary** — The runner now records what every run cost. After each `claude`
invocation it finds the session transcript Claude Code left in
`~/.claude/projects/<cwd-slug>/<session-id>.jsonl`, sums `message.usage` grouped
by model, prices it against `claude_model_pricing` and upserts one `claude_usage`
row keyed on `session_id`. Work landed in
`~/Documents/GitHub/klarity-claude-kit` (commit `1f204ff`), runner `0.14.0`.

Two things the plan did not anticipate, both found by reading a real transcript:

- **Usage is repeated per content block.** A single reply writes 2–3 assistant
  lines that each carry the *same* `message.usage` (61 lines / 30 messages in the
  sample). Summing lines the way the plan described would have roughly doubled
  every bill. Rows now dedupe on `message.id`.
- **`isSidechain` turns are kept.** Subagent work is billed like any other, so it
  belongs in the session's total.

**Files changed** (all under `klarity-claude-kit/plugins/dev-kit/runner`):
- Created: `src/sessionUsage.js` (201 lines) — `slugFor`, `projectDir`,
  `findSessionFile`, `sumUsage`, `costOf`, `totalsOf`, `recordUsage`
- Created: `test/sessionUsage.test.js` — 8 tests
- Modified: `src/run.js` — `runStartMs` before the run; one `recordUsage` call
  after the log is written
- Modified: `src/kanban.js` — `gql` exported so `sessionUsage.js` reuses it
- Modified: `README.md` — "Per-session token usage" section + file table
- Modified: `package.json` — 0.13.0 → 0.14.0 (MINOR)

**Verification**
- `npm test` — 57/57 pass (8 new: slug derivation, per-block dedupe, model
  switch + run bracketing, dominant-model cost, dated id + unpriced model,
  transcript picking, live-shaped upsert, the two quiet paths).
- `node src/run.js --check` — loads and reports all 8 repos normally.
- **Live end-to-end** against `https://todzz.admin.servicehost.io`: `recordUsage`
  run twice over this session's real transcript →
  `usage: claude-opus-5 2271895 in / 29536 out → $2.3296` both times, and
  `claude_usage` holds exactly **one** row (`session_id`
  `c3de25c3-…`, `cost_usd` 2.329618, `usage_by_model` populated, `started_at`/
  `ended_at` set, `user_id` resolved from the board). Idempotency confirmed.
- Cost sanity: 2.19M cache-read × $0.50 + 79k cache-write × $6.25 + 29.5k out ×
  $25 per Mtok = $2.33. ✔

**Deviations**
1. **`recordUsage` is called from `run.js`, not `closeLoop`.** `closeLoop` only
   runs on a clean, renamed, card-bearing success — but a run that failed,
   finished dirty or stopped at the usage wall spent real tokens too, and those
   are exactly the runs worth costing. One call site in `run.js` covers every
   path; `todo_id` comes from `cardIdOf(content)` (already exported), `user_id`
   from the board lookup, both `null`-tolerant for hand-written runs.
2. **`findSessionFile` prefers `birthtime`** over "latest last-line timestamp".
   A fresh `claude -p` always creates a new file, so being *born* during the run
   is a stronger signal than mtime and survives a second session in the same
   repo; mtime stays the fallback for a resumed session. Cheaper than parsing
   every candidate's last line, too.
3. **No prefix matching in `priceOf`.** Transcript model ids match
   `claude_model_pricing` keys exactly today (`claude-opus-5`,
   `claude-opus-4-8`); exact + strip-trailing-date covers it, and the speculative
   third fallback was cut in the simplify pass.

**Follow-up** — the running runner holds its code in memory, so it picks this up
only after `launchctl kickstart -k gui/$(id -u)/eu.todzz.kanban-runner`
(done at the end of this session, after this file was committed).
