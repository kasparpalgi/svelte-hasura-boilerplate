# Todo

Open and execute a task from `doc/todo/` by number.

## Variables

task_number: $ARGUMENTS (e.g. `001`)

---

## Instructions

1. Find the file in `doc/todo/` whose name starts with `$ARGUMENTS` (e.g. `002.md`).
3. Confirm the plan is actionable (no placeholder text remaining). If plan is planning a bigger task then first create the following new 002, 003 etc whatever sequence numbers needed new todo tasks and do during this session reasonable amount of work to do during one session and/or create subagents with model that makes sense. Opus 4.8 hard, Sonnet 4.6 medium and Haiku easier tasks. Also in top of each todo file that you create write what model and with what effort medium, high etc. it shall be run.
4. Leave the top part of the file as is. Log your plan & actions below in the same file. Rename the file from plain number eg. `102.md` to something more describing eg. `102-innerPagesSpeedImprove-TODO.md` (if needs human todo) or `102-innerPagesSpeedImprove-DONE.md` if not and complete.
4. If plan actionable and not a planning task then do the task.
5. After completion update the task file:
   - check off verification items and add a `## Results` section.
   - **Summary** — bulleted list of completed work
   - **Files changed** — created / modified / deleted
   - **Verification** — status of each check
   - **Deviations** — any changes from the plan, or "None"
6. Now look at your summary with fresh critical eye: most probably you overcomplicated something somewhere as LLMs just do it most of the time!!!! Make it better now and make it less comlicated! If too much context used already then create followup todo task(s) for that.
7. Depending on what codechanges made, run the verifications that make sense:
   - Run Svelte autofixer MCP
   - Run `npm run check` after TypeScript/Svelte changes
   - Use `displayMessage()` for user feedback, `loggingStore` for production logs
   - Run prettier. Playwright MCP — test in browser, capture console logs.
   - Tests (unit, E2E, golden) and `npx fallow` and fix any new issues it surfaces before finalizing.
8. After completion update the task file:
   - check off verification items and add a `## Results` section.
   - **Summary** — bulleted list of completed work
   - **Files changed** — created / modified / deleted
   - **Verification** — status of each check
   - **Deviations** — any changes from the plan, or "None"
9.  **Ship it** — once verification is green, commit → push
   1. `git pull` first to make sure up to date. Then `git add -A && git commit` with a Conventional Commit subject (see global CLAUDE.md). Work directly on `main`; one logical change per commit.
   2. `git push origin main`

IMPORTANT: Execute the task ONLY if the task file doesn't say that it is only for planning — then points 5+ do not apply & create the following new files in `.claude/todo` folder +1, +2, +3 numbers from current `$ARGUMENTS` todo item and in the top of each file define depending on the file complexity the model to be used and effort eg. Opus 4.8 medium, Sonnet 4.6 high, or so easy that Chinese GLM 5.3, DeepSeek V3 Pro, Haiku 4.5 can do it. Each todo file of size of most reasonable amount for one session.).

### Rules

- **Stores** — follow factory pattern (single `$state`, browser guard, getters)
- **Components/Routes** — use Svelte 5 runes, call `svelte-autofixer` on all Svelte files
- **Tests** — unit tests for stores, component tests for UI, E2E with Playwright (browser-based)

### Rule "Svelte MCP server"

- Use the Svelte MCP server for all Svelte/SvelteKit work:
  1. **`list-sections`** — call first to discover relevant docs sections
  2. **`get-documentation`** — fetch full docs for sections identified above
  3. **`svelte-autofixer`** — validate Svelte code before sending to user; keep calling until no issues remain
  4. **`playground-link`** — only on user request, never when code was written to project files

### Rule "Fallow — frontend codebase intelligence"

Use Fallow, a deterministic codebase intelligence engine, for structural truth, architecture hotspots, duplication, and cleanup evidence on the TypeScript/JavaScript/Svelte frontend.

When generating, editing, or refactoring frontend code:

1. Run `npx fallow audit --base <pre-session-commit> --format json` to analyze the impact of
   your changes on the JS/TS side. **Always pass `--base` explicitly**, pinned to the commit
   the session started from. The default base is the merge-base with `origin/main`, so once
   any of the session's work has been committed or pushed, the audit compares your changes
   against themselves and reports a false `pass` with zero "introduced" findings.
2. Inspect the JSON output:
   - Check `verdict` (pass / warn / fail).
   - Review the `actions` array on any reported issues.
   - If an issue has `"auto_fixable": true`, safely apply it, or run `npx fallow fix --dry-run --format json` to preview first.
3. Correct any new boundary violations, duplicate logic, or dead code before finalizing the task.

**Available Fallow commands:**

- `npx fallow audit --format json` — PR/change risk (pass/warn/fail).
- `npx fallow dead-code --format json` — unused files/exports.
- `npx fallow dupes --format json` — duplicated logic.
- `npx fallow health --score --targets --format json` — complex hotspots and refactor priorities.

### Rule "Version bump"

After every task iteration, bump the version in both:

1. `package.json` — `"version"` field

Use semantic versioning: increment PATCH for fixes, MINOR for new features.

----

- **Hasura changes** — create migration SQL + apply metadata
- **GraphQL documents** — add to `src/lib/graphql/documents.ts`, run `npm run generate`
- **Stores** — follow factory pattern (single `$state`, browser guard, getters)