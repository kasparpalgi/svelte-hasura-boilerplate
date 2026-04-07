# Create Plan

Create a detailed implementation plan before making changes. Plans are thorough task files that capture context, rationale, and step-by-step tasks.

## Variables

request: $ARGUMENTS (describe the feature, bug fix, or change to plan)

---

## Instructions

**IMPORTANT:** You are creating a PLAN, not implementing changes yet. Research thoroughly, then output a plan file.

### Phase 1: Research

1. **Read core files:**
   - `CLAUDE.md` — patterns, store factory, GraphQL workflow
   - `src/lib/graphql/documents.ts` — existing queries/mutations
   - `src/lib/graphql/generated.ts` — existing types

2. **Explore affected areas:**
   - Relevant routes in `src/routes/[lang]/`
   - Relevant stores in `src/lib/stores/`
   - Relevant components in `src/lib/components/`
   - Relevant Hasura migrations in `hasura/migrations/`

3. **Understand connections:**
   - What GraphQL operations are needed?
   - What Hasura schema changes are needed?
   - What stores need creating or updating?
   - What routes/components are affected?

### Phase 2: Create Plan File

Create the plan in `.claude/todo/` with filename: `NNN-kebab-case-name.md`
- Use the next available number prefix
- Use the task template from CLAUDE.md

```markdown
# Task: [Feature Name]

## Original Requirement
[NEVER REMOVE — copy the full request here]

## Analysis
- Affected files: [list]
- MCP needed: [sequential-thinking for complex features, playwright for testing]
- Hasura changes: [yes/no — describe]
- GraphQL operations: [list queries/mutations needed]

## Implementation Plan
1. [Step — Hasura migration/metadata]
2. [Step — GraphQL document]
3. [Step — npm run generate]
4. [Step — Store]
5. [Step — Component/Route]
6. [Step — Tests]

## Changes
- `hasura/migrations/...`: [description]
- `src/lib/graphql/documents.ts`: [operations to add]
- `src/lib/stores/[name].svelte.ts`: [description]
- `src/routes/[lang]/...`: [description]
- `src/lib/components/...`: [description]
- `tests/...`: [description]

## Verification
- [ ] Browser tested (Playwright MCP)
- [ ] DB verified (Hasura Console)
- [ ] Tests passing
- [ ] `npm run check` passed
- [ ] `npm test` passed
```

### Phase 3: Report

After creating the plan:
1. Summarize what the plan covers
2. List open questions or blockers
3. Provide the full path to the plan file
4. Remind user to run `/implement [path]` to execute
