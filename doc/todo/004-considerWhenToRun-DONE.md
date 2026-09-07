# Consider when to run depending on session usage

## Original Requirement

[NEVER REMOVE]

If you think that there's too little % of session left for even slightly cheaper model then wait until reset time. Or lower slightly the model/effort if makes sense and can be like that run before session % exhaustes.

_From Kanban card `baf07592-83c9-423e-8da2-f5750678dac9`._

_GitHub issue #4 — end the commit subject with `(#4)`._

---

## Results

**Summary** — The fix lives in the runner (`klarity-claude-kit`, not this repo): there is
no API for a headless script to ask "% of session left" ahead of time, so the only real
signal is the CLI's own usage-limit message after a run. On that signal the runner now
steps the tier down one notch (effort first, then family — `downgrade()` in
`src/classify.js`) and retries the same task immediately, since a cheaper tier spends the
usage budget slower and may still finish before the window closes. Once already at
`haiku / low` and still hitting the wall, it stops retrying and waits: every repo sits
idle until a recorded reset time (5h for a session limit, 7 days for a weekly one — kept
deliberately conservative rather than parsing the exact printed time, which carries a
timezone). New `src/usage.js` detects the limit message; `src/state.js` persists the
account-wide `cooldownUntil`; `src/run.js` wires the retry-then-wait loop into
`runRepo`/`tick`, and `--check` plus the `Runner ⏳ usage limit` notification both surface
the wait.

**Files changed** (all in `klarity-claude-kit`):

- Created `plugins/dev-kit/runner/src/usage.js` — `usageLimitHit(output)`.
- Created `plugins/dev-kit/runner/test/usage.test.js`, `test/classify.test.js`,
  `test/state.test.js`.
- Modified `plugins/dev-kit/runner/src/classify.js` — added `downgrade(tier)`.
- Modified `plugins/dev-kit/runner/src/state.js` — added `setCooldown`/`cooldownUntil`.
- Modified `plugins/dev-kit/runner/src/run.js` — retry-with-downgrade loop in `runRepo`,
  cooldown check in `tick()` and `check()`.
- Modified `plugins/dev-kit/runner/README.md` — documented the new "Usage limits" behavior.
- Bumped `plugins/dev-kit/runner/package.json` (0.9.1 → 0.10.0) and
  `plugins/dev-kit/.claude-plugin/plugin.json` (0.11.1 → 0.12.0).

**Verification**

- `npm test` in the runner: 23 passing (7 new).
- No change needed in this repo — nothing here implements runner behavior.

**Deviations** — Landed in `klarity-claude-kit` (where the runner lives), matching the
prior model-selection bug fix (task 002) which also crossed repos. This repo's own
version was not bumped since no file in it changed.
