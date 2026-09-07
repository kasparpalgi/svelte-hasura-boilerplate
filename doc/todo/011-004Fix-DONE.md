> Run with: Opus 4.8 / high

# 004 fix

## Original Requirement

[NEVER REMOVE]

Opus 4.8 / high
Todo task 004 was meant to plan running depending on the current session usage and another task was meant to pick correctly the model effort depending on the dropdown I pick in the card in todzz.eu kanban board and another todo task I already asked to fix that if the agent creates followup tasks then it shall put them in kanban board backlog not TODO in file name in the repo. At the moment situation is that in ezyspace-landing repo agent created lot of followup tasks with TODO in filename and then they were picked up one by one and run although session limit was already reached:

20:28:28 ✔ 006-landingPageDesignSkills-TODO.md — committed and pushed
20:28:28 no card id in 006-landingPageDesignSkills-DONE.md — no card to close
20:29:03 ▶ kasparpalgi/ezyspace-landing 007-megamenuRoutingInfra-TODO.md (Sonnet 5 / medium, attempt 1)
20:57:41 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/007-megamenuRoutingInfra.log
Everything up-to-date
20:57:42 ✔ 007-megamenuRoutingInfra-TODO.md — committed and pushed
20:57:42 no card id in 007-megamenuRoutingInfra-DONE.md — no card to close
20:58:23 ▶ kasparpalgi/ezyspace-landing 008-megamenuLinkMigration-TODO.md (Sonnet 5 / medium, attempt 1)
20:58:36 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/008-megamenuLinkMigration.log
20:58:36 ⚠ 008-megamenuLinkMigration-TODO.md — ran but did not finish: 008-megamenuLinkMigration-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
20:59:07 ▶ kasparpalgi/ezyspace-landing 008-megamenuLinkMigration-TODO.md (Sonnet 5 / medium, attempt 2)
20:59:14 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/008-megamenuLinkMigration.log
20:59:15 ⚠ 008-megamenuLinkMigration-TODO.md — ran but did not finish: 008-megamenuLinkMigration-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
20:59:46 ▶ kasparpalgi/ezyspace-landing 009-megamenuUI-TODO.md (Sonnet 5 / medium, attempt 1)
20:59:53 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/009-megamenuUI.log
20:59:53 ⚠ 009-megamenuUI-TODO.md — ran but did not finish: 009-megamenuUI-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
21:00:25 ▶ kasparpalgi/ezyspace-landing 009-megamenuUI-TODO.md (Sonnet 5 / medium, attempt 2)
21:00:32 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/009-megamenuUI.log
21:00:32 ⚠ 009-megamenuUI-TODO.md — ran but did not finish: 009-megamenuUI-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
21:01:04 ▶ kasparpalgi/ezyspace-landing 010-nutikasAriCopy-TODO.md (Sonnet 5 / medium, attempt 1)
21:01:11 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/010-nutikasAriCopy.log
21:01:11 ⚠ 010-nutikasAriCopy-TODO.md — ran but did not finish: 010-nutikasAriCopy-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
21:01:42 ▶ kasparpalgi/ezyspace-landing 010-nutikasAriCopy-TODO.md (Sonnet 5 / medium, attempt 2)
21:01:49 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/010-nutikasAriCopy.log
21:01:49 ⚠ 010-nutikasAriCopy-TODO.md — ran but did not finish: 010-nutikasAriCopy-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
21:02:21 ▶ kasparpalgi/ezyspace-landing 011-rentalSubsectionsBatchA-TODO.md (Sonnet 5 / medium, attempt 1)
21:02:28 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/011-rentalSubsectionsBatchA.log
21:02:28 ⚠ 011-rentalSubsectionsBatchA-TODO.md — ran but did not finish: 011-rentalSubsectionsBatchA-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
21:03:00 ▶ kasparpalgi/ezyspace-landing 011-rentalSubsectionsBatchA-TODO.md (Sonnet 5 / medium, attempt 2)
21:03:07 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/011-rentalSubsectionsBatchA.log
21:03:07 ⚠ 011-rentalSubsectionsBatchA-TODO.md — ran but did not finish: 011-rentalSubsectionsBatchA-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
21:03:39 ▶ kasparpalgi/ezyspace-landing 012-rentalSubsectionsBatchB-TODO.md (Sonnet 5 / medium, attempt 1)
21:03:46 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/012-rentalSubsectionsBatchB.log
21:03:46 ⚠ 012-rentalSubsectionsBatchB-TODO.md — ran but did not finish: 012-rentalSubsectionsBatchB-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand
21:04:18 ▶ kasparpalgi/ezyspace-landing 012-rentalSubsectionsBatchB-TODO.md (Sonnet 5 / medium, attempt 2)
21:04:25 log → /Users/klarity/Documents/GitHub/ezy/ezyspace-landing/.claude/todo/012-rentalSubsectionsBatchB.log
21:04:25 ⚠ 012-rentalSubsectionsBatchB-TODO.md — ran but did not finish: 012-rentalSubsectionsBatchB-TODO.md was never renamed to -DONE; tree is clean — probably finished, just not renamed; rename it by hand

_From Kanban card `3cf13c61-a33e-4009-a094-9b87133a0a92`._

_GitHub issue #11 — end the commit subject with `(#11)`._

## Results

**Summary** — Three concerns in the task; the fix for all of them lives in the
`klarity-claude-kit` dev-kit plugin, not this repo (this repo is the cross-repo task hub).

1. **Model/effort from the card dropdown** — already fixed. `svelte-todo-kanban`
   `src/lib/server/taskfile.ts:ensureRunWith` reconciles the card's `agent_model` /
   `agent_effort` fields into the `> Run with:` line (its comment names the exact
   "chose Opus, ran Sonnet" bug), and the runner's `classify.js:explicitTier` honours the
   pinned version + effort. No change needed.

2. **Session-usage gating** — reactive throttle + cooldown already landed in `aa0b525`
   (after the failure log above). The remaining gap: the detector never recognised Claude
   Code's headless wall message. Fixed `usage.js` to catch `Claude AI usage limit
   reached|<epoch>` (used as the *exact* reset time) and a bare "usage limit reached".
   Before this, a session already at the wall produced empty runs the runner read as
   "tree clean — probably finished", so it kept marching — exactly the log above.

3. **Follow-ups must go to Kanban Backlog, not `-TODO` files** — the real still-broken bug
   and the direct cause of the avalanche in the log. The runner (`kanban.js:fileFollowUps`)
   already files suffixless `NNN-slug.md` files as Backlog cards and `queue.js:listPending`
   only auto-runs `-TODO.md`, so the runner design was correct — but the `/todo` and
   `/plan` skills told agents to name follow-ups `-TODO.md`, so every split-out task got
   run one-by-one. Fixed the skills: agent-created follow-ups are now named `NNN-slug.md`
   with **no suffix** (Backlog, human-triaged, never auto-run), carry no `_From Kanban
   card_` line, and `/plan` writes only its first slice as `-TODO.md`.

**Files changed** (all in `~/Documents/GitHub/klarity-claude-kit/plugins/dev-kit/`)
- modified `runner/src/usage.js` — epoch + bare "usage limit reached" detection
- modified `runner/test/usage.test.js` — two new tests (25 pass)
- modified `skills/todo/SKILL.md` — follow-ups are suffixless Backlog files
- modified `skills/plan/SKILL.md` — only the first slice is `-TODO`, rest suffixless
- modified `runner/package.json` — 0.10.0 → 0.10.1
- modified `.claude-plugin/plugin.json` — 0.12.0 → 0.12.1

**Verification** — `node --test test/*.test.js` → 25 pass / 0 fail.

**Deviations** — No code change was needed for concerns 1 & 2 beyond the usage-detection
gap; they were verified against the live sibling repos rather than reimplemented.
