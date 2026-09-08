> Run with: Opus 4.8 / high

# 008 fix

## Original Requirement

[NEVER REMOVE]

008 was meant not to close the terminal once the session finished so I can write followups but yes, think how then we end the session so that we can mark it done and in filesystem and move to review list and mark in github done.... Do not disturb with your work any other possible running sessions. I will restart the Herdr myself when it's time.

Also last session again I set from dropdown Opus 4.8 but was run with Sonnet 5. PS this one is also meant to run Opus 4.8 and high.

_From Kanban card `abd44347-ec99-4f4d-b9a7-5cd1fb7085e1`._

_GitHub issue #10 — end the commit subject with `(#10)`._

## Results

**Summary** — Both concerns in this card were already resolved by prior work; this
session verified them end-to-end and added one small runner safeguard for the recurring
model-fidelity worry. No behaviour needed to be built for "ending the session" — it never
depended on the terminal closing.

**How the session actually ends (the answer to the question)**

008 left the herdr pane open at the shell prompt. That is fully **decoupled** from the
close-loop, so all three outcomes still happen:

- `runInHerdr()` waits on the *agent's status* (`agent wait --until idle/done/blocked`),
  not on the pane closing. When the agent finishes `/todo` and returns to idle, the wait
  returns and `runInHerdr()` returns — the open pane is irrelevant to this.
- Back in `run.js`, once the agent settles the runner runs the close-loop:
  1. **filesystem** — the agent's own `/todo` step 6 renamed `NNN-…-TODO.md` → `-DONE.md`;
     `run.js` confirms the rename + a clean tree before treating the run as finished, then
     `git push`.
  2. **review list** — `kanban.js closeLoop()` moves the card to **Review**, points it at
     the `-DONE` file, and posts the agent's Results as a comment (idempotent).
  3. **GitHub** — `issue.js reportToIssue()` comments the Results on the issue and closes
     it (`-BLOCKED.md` is the one exception — issue stays open).
- The pane then simply sits open for a human follow-up; the *next* run's `reap()` reclaims
  it. Manual sessions (e.g. ezy-iot) are never touched — reap only closes `task-*` tabs.

**Verified live** — issues **#8, #9, #11 are all CLOSED**; their task files are all
`-DONE.md`. So the close-loop is firing in production, not just in theory.

**Model bug ("set Opus 4.8, ran Sonnet 5")** — root cause and fix live in
`svelte-todo-kanban/src/lib/server/taskfile.ts`, and are already committed + pushed to
`origin/main` (`c3f4df3`, `4f02c92`, 2026-09-07):

- `resolveRunWith()` now prefers the card's `agent_model` / `agent_effort` **dropdown
  fields**, falling back to a hand-typed "Run with:" line only when the fields are unset.
- `ensureRunWith()` reconciles a **frozen draft's** stale `> Run with:` line against the
  now-set field when the card reaches the agent list — the exact "chose Opus, ran Sonnet"
  path (a draft froze its line before the dropdown was touched, or had none, so the runner
  fell back to its classifier → latest Sonnet).
- The runner side (`classify.js explicitTier`) already parses `Opus 4.8 / high` →
  `claude-opus-4-8` / high correctly.
- This card ran Opus 4.8 / high as requested; its file carries the correct line.
- **Caveat for the human:** the fix only helps once the deployed todzz instance is running
  ≥ `c3f4df3`. If a redeploy hasn't happened, the dropdown is still ignored server-side.
  Worth confirming against the live app.

**This session's change (runner)** — the phone notification on a finished run never said
*which* model ran, and the usage-limit path can silently step the tier down mid-run — a
real "ran a different model than I picked" path with zero visibility. `run.js` now appends
the resolved tier to the ✔ / ⇥ notification (`repo file · Opus 4.8 / high`), so a mismatch
is caught at a glance on the phone.

**Files changed**
- `klarity-claude-kit/plugins/dev-kit/runner/src/run.js` — tier label in the end-of-run
  notification (modified).
- `klarity-claude-kit/plugins/dev-kit/runner/package.json` — 0.10.1 → 0.10.2.
- `klarity-claude-kit/plugins/dev-kit/.claude-plugin/plugin.json` — 0.12.1 → 0.12.2.
- This task file (outcome).
- No source changed in `svelte-hasura-boilerplate` (the model + close-loop fixes live in
  the runner and the Kanban app).

**Verification**
- `node --check src/run.js` — clean.
- `npm test` (runner) — **25/25 pass**.
- Live: issues #8/#9/#11 CLOSED, task files `-DONE`, close-loop confirmed firing.

**Deviations** — No new "explicit end-session" trigger was built: the close-loop already
fires on agent-settle and satisfies all three outcomes while the pane stays open, so adding
one would be complexity for its own sake. Other running sessions were not disturbed; Herdr
was not restarted (left to the human, as requested).
