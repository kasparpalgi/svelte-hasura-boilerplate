> Run with: Sonnet 4.6 / medium

# New task number

## Original Requirement

[NEVER REMOVE]

When AI creates followup new tasks:

1. Create board card
2. Creates gh issue with number
3. Creates md file with same number (if number exists then move it to todo/archive subfolder if it was DONE otherwise to todo/duplicate folder)

Atm no gh issue created and when gh number exists then bigger available number is picked.

_From Kanban card `bee97501-7d33-4e73-822a-2b7da462d5b9`._

_GitHub issue #34 — end the commit subject with `(#34)`._

## Results

**Summary** — Updated the `/plan` skill in `klarity-claude-kit` so that creating a followup task now: (1) creates a GitHub issue first and uses its number for the task file, (2) handles number conflicts by moving DONE files to `archive/` and others to `duplicate/`, and (3) reports the GH issue URL at the end. Plugin bumped to 0.14.0.

**Files changed**
- Modified: `plugins/dev-kit/skills/plan/SKILL.md`
- Modified: `plugins/dev-kit/.claude-plugin/plugin.json` (0.13.0 → 0.14.0)

**Verification** — Skill-only change; no type-check or test suite applies. Logic reviewed manually.

**Deviations** — None
