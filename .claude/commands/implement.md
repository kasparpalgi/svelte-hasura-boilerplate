# Implement

Execute an implementation plan from `.claude/todo/`. Read the plan, execute each step in order, verify, and report.

## Variables

plan_path: $ARGUMENTS (path to the plan file, e.g., `.claude/todo/002-add-users-feature.md`)

---

## Instructions

### Phase 1: Understand the Plan

1. Read the plan file completely.
2. Check for open questions or blockers — stop and ask if any exist.
3. Confirm the plan is actionable (no placeholder text remaining).

### Phase 2: Execute

Follow steps in exact order. For each step:

- **Hasura changes** — create migration SQL + apply metadata
- **GraphQL documents** — add to `src/lib/graphql/documents.ts`, run `npm run generate`
- **Stores** — follow factory pattern (single `$state`, browser guard, getters)
- **Components/Routes** — use Svelte 5 runes, call `svelte-autofixer` on all Svelte files
- **Tests** — unit tests for stores, component tests for UI, E2E with Playwright

Rules:
- Run `svelte-autofixer` on every `.svelte` file written before moving on
- Run `npm run check` after all TypeScript/Svelte changes
- Use `displayMessage()` for user feedback, `loggingStore` for production logs
- No global prettier runs

### Phase 3: Verify

1. `npm run check` — must pass
2. `npm test` — must pass
3. Playwright MCP — test in browser, capture console logs
4. Hasura Console — verify DB changes if applicable

### Phase 4: Update Plan

After implementation, update the plan file:
- Check off each verification item
- Add a "## Results" section summarizing what was done and any deviations

### Report

Provide:
1. **Summary** — bulleted list of completed work
2. **Files changed** — created / modified / deleted
3. **Verification** — status of each check
4. **Deviations** — any changes from the plan, or "None"
