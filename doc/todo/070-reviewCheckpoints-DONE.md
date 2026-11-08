> Run with: Opus 5.5 / high

# Review checkpoints: acceptance criteria and plan-first

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Review checkpoints: acceptance criteria and plan-first

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. Backlog.md (7k★) builds agent work around three human checkpoints — **spec, plan, code** — and gives every task acceptance criteria plus a Definition of Done. Lisa checks the acceptance criteria before it opens a PR; Camelot and Archon stop for plan approval before writing code. We have the spec checkpoint (`/plan` → draft → TODO) and the code checkpoint (Review), but nothing in between, and no criteria to check against.

1. **Acceptance criteria** (dev-kit skills only): `/plan` writes an `## Acceptance criteria`checklist into every task file it makes; `/todo` ticks each one in `## Results` with the evidence (test name, command output, screenshot), or says why not.
2. **Plan first** (opt-in per card): a `> Plan first` line under `> Run with:` (a card checkbox in todzz writes it, as the model and machine fields do). `/todo` then writes `## Plan` and ends `-BLOCKED` with "approve the plan". The human comments and moves the card back; since svelte-todo-kanban 0.23.0 those comments reach the agent in `## Card comments`, and the second run builds.

## Acceptance criteria

- [ ] `/plan` output has an acceptance-criteria checklist; `/todo` Results address each item.
- [ ] A `> Plan first` card ends its first run BLOCKED with a plan and no code changes.
- [ ] Re-queued, it builds the approved plan, taking the review comments into account.

*GitHub issue #70 — end the commit subject with* `(#70)`*.*

_From Kanban card `2b7115e6-83c9-456a-b521-2c9ab6586192`, moved to the agent list._

_GitHub issue #70 — end the commit subject with `(#70)`._

## Results

**Summary** — The three checkpoints are now spec → **plan** → code. Two repos changed:

- **dev-kit 0.21.0** (`klarity-claude-kit` `d572237`): `/plan` adds an `## Acceptance criteria`
  checklist to its template, written as outcomes a reviewer can check. `/todo` ticks each one in
  Results with its evidence, or says why not. `/todo` also reads `> Plan first`. If the file has
  no `## Plan` yet, the run writes one, changes nothing else, and ends `-BLOCKED` ("approve the
  plan"). If `## Plan` is already there, the re-queue counts as approval: the run builds it, and
  `## Card comments` win where they disagree with the plan.
- **todzz 0.24.0** (`svelte-todo-kanban` `503e947`, `c7c0256`): a new **Plan first** checkbox next
  to the model, effort and machine fields (`todos.agent_plan_first`, boolean, default false). It
  writes `> Plan first` under `> Run with:` / `> Machine:`, and `ensurePlanFirst` adds or removes
  the line on frozen drafts, like `ensureMachine` does. **A gap I found and fixed:** a card moved
  back from Review got a *fresh* task file built from the card text. The board's
  `task_file_path` still named the `-TODO.md` the agent had renamed, so the approved `## Plan`
  was lost and the file got a new number. `write-task-file` now finds the `-BLOCKED.md` twin and
  re-queues it as itself (BLOCKED → TODO in one commit), keeping the plan and the first Results,
  with the comments appended.

**Files changed**
- klarity-claude-kit: `plugins/dev-kit/skills/plan/SKILL.md`, `skills/todo/SKILL.md`, `README.md`, `.claude-plugin/plugin.json`
- svelte-todo-kanban: migration `1808000000000_add_agent_plan_first_to_todos` (new), `public_todos.yaml`,
  `taskfile.ts`, `write-task-file`, `write-draft-file`, `update-task-file` endpoints, `CardDetailView.svelte`,
  `cardHelpers.ts`, `todos.svelte.ts`, `documents.ts` + generated types, en/et/cs locales, tests
- this repo: this task file only

**Verification**
- todzz `npm run check`: 0 errors, 0 warnings
- todzz `npm run test:unit:all`: 32 files, 376 tests pass. New tests: `ensurePlanFirst` (4),
  BLOCKED `todoPathFor`, "re-queues a -BLOCKED file as itself, keeping its plan and adding the
  review", "writes > Plan first when the card has the box ticked", and all three endpoints select
  `agent_plan_first`
- svelte-autofixer on the new checkbox markup: no issues
- Hasura (todzz prod): column added with `run_sql`. Metadata replaced with the column added to the
  `user` insert/select/update lists; the API reported `is_consistent: true`. Codegen ran against it.
- todzz `npm run test:e2e`: **could not run here**. The Playwright config uses the Google Chrome
  channel (`/opt/google/chrome/chrome`), which this WSL box doesn't have, so even the
  unauthenticated login-page specs fail to launch. This is environmental, not caused by the change.
- Not browser-tested: no Playwright MCP was connected this session

**Acceptance criteria**
- [x] `/plan` output has an acceptance-criteria checklist; `/todo` Results address each item.
  Evidence: dev-kit `d572237`, template plus step-6 Results format (this Results section uses it).
- [ ] A `> Plan first` card ends its first run BLOCKED with a plan and no code changes. Built: the
  card writes the line (test "writes > Plan first…") and `/todo` has the rule. Not yet seen live:
  that needs the Vercel deploy of todzz 0.24.0 and dev-kit 0.21.0 on the runners
  (`claude plugin update dev-kit@klarity`), then one real card.
- [ ] Re-queued, it builds the approved plan, taking the review comments into account. Built:
  the BLOCKED file is re-queued with `## Plan` plus `## Card comments` (test "re-queues a -BLOCKED
  file as itself…"), and `/todo` builds when `## Plan` exists. Not yet seen live, for the same reason.

**Deviations**
- Added the BLOCKED → TODO re-queue in todzz. The task assumed comments alone carry the approval,
  but without this fix the plan itself never reached the second run.
- I applied the migration through the Hasura HTTP API (`run_sql` + `replace_metadata`) because the
  `hasura` CLI isn't installed here. The migration files are committed for other environments.
- No `package.json` bump in this repo, since only this task file changed. todzz went to 0.24.0
  and dev-kit to 0.21.0.
- My first todzz commit swept in a regenerated `playwright-report/` from the failed e2e run. It was
  restored byte-for-byte in `c7c0256`.
