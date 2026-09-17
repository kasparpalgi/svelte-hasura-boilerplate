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
