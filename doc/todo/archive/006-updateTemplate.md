# Task: Adopt Best Parts of claude-workspace-template

## Original Requirement
See ../claude-workspace-template outside of this project's working folder. There's a possible great Claude starting point template. Analyse it and then analyse my current Svelte + Hasura + some other stach starting point new app template together with Claude and AI agents files.

Then take all the good parts of that template and implement to this template. Update README for setup, update CLAUDE.md and all other files needed.

First plan in this file and then move on with the subtasks one by one.

---

## Analysis

### claude-workspace-template has:
- `.claude/commands/` — slash commands: `/prime`, `/create-plan`, `/implement`
- `.claude/skills/` — reusable skill packages (mcp-integration, skill-creator)
- `context/` — project context files (business-info, personal-info, strategy, current-data)
- `plans/` — implementation plan files
- `outputs/` — deliverables
- `reference/` — templates/patterns
- `shell-aliases.md` — `cs` and `cr` shell aliases for launching Claude Code with `/prime`
- CLAUDE.md focused on workspace orientation, session workflow, maintaining the file

### Boilerplate already has:
- Comprehensive `CLAUDE.md` — stack, patterns, store factory, GraphQL workflow
- `AGENTS.md`, `GEMINI.md` — for other AI agents
- `.claude/todo/` — task tracking files
- `.claude/prompt.md` — session prompt (currently placeholder)
- `.claude/settings.local.json` — permissions
- `README.md` — dev setup guide

### What to adopt (high value):
1. Slash commands: `/prime`, `/create-plan`, `/implement` — adapted for Svelte/Hasura
2. `shell-aliases.md` — `cs`/`cr` launch aliases with `/prime`
3. CLAUDE.md: add "Commands" section + session workflow
4. README.md: add AI Tooling section
5. AGENTS.md + GEMINI.md: sync add-ons list with CLAUDE.md (currently outdated)
6. `.claude/prompt.md`: update to a useful session hint

### What NOT to adopt:
- Generic context/ template files (business-info, personal-info) — not relevant to code boilerplate
- skill-creator / mcp-integration skills — too generic
- plans/ / outputs/ / reference/ directories — todo/ already covers this

---

## Implementation Plan

1. Update `.claude/todo/boilerplate/006-updateTemplate.md` — add plan (this file)
2. Create `.claude/commands/prime.md` — session initialization
3. Create `.claude/commands/create-plan.md` — plan a feature/task
4. Create `.claude/commands/implement.md` — execute a plan
5. Create `shell-aliases.md` — shell aliases for project
6. Update `CLAUDE.md` — add Commands section + session workflow
7. Update `AGENTS.md` — sync add-ons list and missing sections
8. Update `GEMINI.md` — sync with CLAUDE.md
9. Update `README.md` — add AI Tooling section
10. Update `.claude/prompt.md` — make useful

---

## Changes
- `.claude/commands/prime.md`: NEW — session initialization slash command
- `.claude/commands/create-plan.md`: NEW — feature planning slash command
- `.claude/commands/implement.md`: NEW — plan execution slash command
- `shell-aliases.md`: NEW — cs/cr shell aliases reference
- `CLAUDE.md`: ADD commands section + session workflow
- `AGENTS.md`: SYNC add-ons list + add scripts reference + UX delight
- `GEMINI.md`: SYNC same as AGENTS.md
- `README.md`: ADD AI tooling section
- `.claude/prompt.md`: UPDATE to be useful

## Verification
- [x] All files created/updated
- [x] Commands follow workspace template conventions
- [x] README updated
- [x] CLAUDE.md updated
