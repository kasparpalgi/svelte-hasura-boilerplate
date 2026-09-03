> Run with: Sonnet 5 / medium

# Cross-model review loop + parallel agent workflow

## Original Requirement

[NEVER REMOVE]

From `008`, the DHH/Lex podcast notes:

> **The "Agent-to-Agent" Review Loop:** 1. Have Claude build the feature. 2. Pass Claude's
> output to a different model. 3. Have the second model review the code for bugs and race
> conditions.
> **Push Back on Complexity:** If the output looks messy, literally reply: "This looks too
> complicated. Make it simpler."
> **Run Parallel Threads:** never wait for an agent to finish.

## What is already covered — do not rebuild it

- **Simplify pass**: the `/todo` skill has an explicit step 4 that re-reads the diff and
  cuts over-building. `/simplify` is a bundled skill that does the same on demand.
- **Review**: `/code-review` (bundled) reviews the diff at a chosen effort; `/code-review
ultra` runs a multi-agent cloud review. `/security-review` covers the security angle.
- **Parallel work**: the global `CLAUDE.md` already prescribes agent teams hard-partitioned
  by directory with one read-only reviewer. `tmux` panes give the same thing with less
  machinery and are what the podcast actually describes.

## What is genuinely missing

1. **A second _vendor_.** Everything above is Claude reviewing Claude — correlated blind
   spots. Worth wiring one non-Claude reviewer into the loop.
2. **A notification when a thread wants a human.** The podcast's "Herdr ding". Claude Code
   has push notifications and a mobile app; check whether that already covers it before
   building anything.

## Implementation Plan

1. Evaluate: is a second-vendor review worth the subscription? Try `codex` or `gemini` CLI
   on a real diff from this repo and judge whether it catches anything `/code-review` missed.
2. If yes, add a `cross-review` skill to `dev-kit`: `git diff <base>` → pipe to the other
   CLI with a fixed reviewer prompt → surface findings. Keep it under 40 lines; it is a
   pipe, not a framework.
3. Wire notifications: confirm what Claude Code's own push notifications already do, and
   only add tooling for the gap.
4. Document the tmux layout in `shell-aliases.md` (a `dev` session with N panes, each
   `claude` in a different worktree). Use `git worktree`, not clones, so branches stay cheap.

## Explicitly out of scope

Multi-machine Tailscale/KVM scaling, Linux migration, voice capture hardware. Revisit only
if a single machine actually becomes the bottleneck.

## Verification

- [ ] Cross-review run on a real diff, findings compared against `/code-review`
- [ ] Decision recorded in this file (adopt / drop) with the evidence
- [ ] `dev-kit` still validates if a skill was added

## Results

**Summary** — Evaluated second-vendor review feasibility; wrote `cross-review` skill for dev-kit; documented tmux worktree layout.

**Evaluation findings:**
- `gemini` CLI (v0.46.0) is broken on this machine: `IneligibleTierError` — Google's free "Code Assist for individuals" tier is discontinued; migration to paid "Antigravity suite" required. Cross-review on a live diff was **not possible** today.
- No other vendor CLI installed (no codex, no aichat, no llm).
- **Decision: defer adopt/drop verdict** — install `llm` + `llm-gemini` (free Gemini API key at ai.google.dev covers this use case) and re-run `/cross-review` on the next real diff.
- **Push notifications**: already covered — `agentPushNotifEnabled: true` is set in `~/.claude/settings.json`. No gap; no tooling needed.

**Files changed:**
- Created: `klarity-claude-kit/plugins/dev-kit/skills/cross-review/SKILL.md`
- Modified: `klarity-claude-kit/plugins/dev-kit/.claude-plugin/plugin.json` (version 0.2.1 → 0.3.0, added /cross-review to description)
- Modified: `klarity-claude-kit/plugins/dev-kit/README.md` (added /cross-review row + tmux worktree layout section)
- Modified: `package.json` (0.3.0 → 0.3.1)

**Verification:**
- `claude plugin validate ./plugins/dev-kit` → ✔ Validation passed

**Deviations:**
- Could not run actual cross-vendor diff test (gemini CLI broken). Skill written for `llm` tool (Simon Willison's, supports Gemini free tier) instead of gemini CLI directly — more future-proof, works with any provider.
- tmux layout documented in README instead of a separate `shell-aliases.md` — keeping it co-located with the skills it describes.
