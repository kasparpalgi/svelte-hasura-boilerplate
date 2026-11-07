> Run with: Opus 5.5 / xhigh
> Machine: dell

# Check other open source ones

## Original Requirement

[NEVER REMOVE]

Kanban board that runs tasks. See the best ones and plan features or ways they do better and that could be implemented.

_From Kanban card `2f7e550e-75cf-4e6e-b352-684f9739aca5`, moved to the agent list._

_GitHub issue #59 — end the commit subject with `(#59)`._

## Research — open-source Kanban boards that run agents (2026-11-07)

**Our setup, for comparison:** todzz.eu (two-way GitHub issue sync, agent list column,
per-card model / effort / machine), the server writes `NNN-slug-TODO.md`, and the
`klarity-claude-kit` runner on 4 machines claims the task, runs Claude in a herdr pane
(visible on the phone), sends Pushbullet alerts, renames DONE / BLOCKED, moves the card to
Review with the Results, records cost per card, files follow-ups as issues and Backlog cards,
and turns usage walls into tier step-downs.

| Tool (★ Nov 2026) | Shape | What it does better than us |
| --- | --- | --- |
| [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) 28.6k | Local board + worktree per attempt | Diff review with inline comments sent back to the agent; built-in app preview; 10+ agent CLIs. **Company shut down Apr 2026** (mostly free users, no business model), now community-run |
| [OpenAI Symphony](https://github.com/openai/symphony) 28k | Spec + Elixir daemon polling Linear | Tracker states as the state machine: `Human Review → Rework → Merging`; one persistent **workpad comment** per issue; **proof of work** (CI, review, walkthrough video); PR feedback sweep; stops the agent when the issue leaves an active state; stall detection; policy in an in-repo `WORKFLOW.md` |
| [Claude Task Master](https://github.com/eyaltoledano/claude-task-master) 28k | PRD → task graph (MCP) | Complexity analysis and expanding a task into subtasks with dependencies |
| [Happy](https://github.com/slopus/happy) 24.5k | Mobile client for agent CLIs | Native app, push, voice, E2E encryption (we use herdr web + Pushbullet + relay PWA) |
| [Archon](https://github.com/coleam00/Archon) 23.9k | YAML workflow engine, issue → merged PR | **Attention items** (what / why / recommendation / choices); build queue + merge queue; review through specialist lenses; "discoveries" filed. 363 of its own 524 Oct PRs built by itself |
| [claude-squad](https://github.com/smtg-ai/claude-squad) 8.7k · [Emdash](https://github.com/generalaction/emdash) 6.2k · [Crystal/Nimbalyst](https://github.com/stravu/crystal) 3.1k | Desktop/TUI, parallel worktrees | Many agents at once on one machine; Emdash imports issues from 10 trackers and runs over SSH |
| [Backlog.md](https://github.com/MrLesk/Backlog.md) 7.3k | Markdown tasks in git, the closest to our `doc/todo` | **Three checkpoints: spec, plan, code**; acceptance criteria + Definition of Done on every task; milestones and dependencies |
| Symphony ports: [Sortie](https://github.com/sortie-ai/sortie), [Itervox](https://github.com/vnovick/itervox), Lisa, Cognit Flow, Hatice | Tracker → agent daemons | CI failures and review comments go back to the agent; "input required" posted as a tracker comment, and a reply there resumes the run; retry with backoff; Lisa injects past failures into the next prompt and checks acceptance criteria before the PR |
| Small boards: [Camelot](https://github.com/T0ha/camelot), Auto-Issue, Kander, Kanbots, [OpenKanban](https://github.com/TechDufus/openkanban) | Board + worktrees | Plan approval before code (Camelot); "reject with feedback" re-runs with that feedback (Auto-Issue, max 3 rounds); an independent reviewer before delivery (Kander) |

**Where we are already ahead.** Almost all of these are single-machine developer tools. We
have: several machines with a CAS claim on the card, peers, secret sync and self-update;
automatic onboarding and offboarding of repos; usage-wall step-down; per-card cost; follow-ups
filed as issues; the git prompt history; and a board that non-developer clients can use.
Symphony treats multi-host as an optional appendix. The Vibe Kanban shutdown is a warning:
their value was the review UI, and GitHub already gives us that for free.

**Gaps worth closing, by value / effort:**

1. **Rework loop:** a card sent back from Review re-ran with only its body, so the reviewer's
   comments never reached the agent (Symphony Rework, Auto-Issue, Itervox). **Built this
   session**, see Results.
2. **Live run status on the card** (Symphony workpad) → `068-liveRunStatusOnCard.md`
3. **Review checkpoints:** acceptance criteria + opt-in plan-first (Backlog.md, Lisa,
   Camelot) → `070-reviewCheckpoints.md`
4. **Stop a run when its card leaves the agent list** (Symphony reconciliation; #51 covers
   only tasks not yet started) → `073-stopRunWhenCardLeaves.md`
5. **A retry knows why the last attempt failed** (Symphony `attempt`, Lisa guardrails) →
   `072-retryKnowsLastAttempt.md`
6. **Proof of work:** screenshots on the card for UI tasks (Symphony, Vibe preview) →
   `069-proofOfWorkScreenshots.md`
7. **Human PR review comments → rework task**, in PR repos (Symphony feedback sweep, Sortie,
   Lisa) → `071-prReviewFeedbackRework.md`

**Deliberately not proposed:**

- **Parallel agents per machine** (Symphony `max_concurrent_agents`, Emdash): the
  subscription usage budget is the bottleneck, not slots, and 4 machines already give 4 at
  once.
- **A diff-review UI / app preview inside todzz:** GitHub does diffs, and this is the thing
  that sank Vibe Kanban's company.
- **A YAML workflow engine / `WORKFLOW.md`** (Archon, Symphony): `CLAUDE.md` + dev-kit skills
  already play that role. Simplicity is genius.
- **Answering a blocked agent from the card** (Itervox): with item 1 in place, a `-BLOCKED`
  card already works this way. Answer in a comment, move it back, and the answer reaches the
  agent. The live `⏸ needs you` stays on the relay PWA.

## Results

**Summary** — Surveyed ~20 open-source agent Kanban / orchestrator projects (above). Answered
"what do they do better" and split the worthwhile gaps into six Backlog follow-ups. Built the
top one in `svelte-todo-kanban` (v0.23.0, `e575f3e`): every task file the board writes —
fresh, draft → TODO, or rewritten after a card edit — now ends with a `## Card comments` thread
(oldest first, author and minute). The board's own bookkeeping notes ("Task file ready", "back
to draft", "✅ Task complete") are left out, and a thread from an earlier queueing is replaced,
not repeated. A card moved Review → agent list now hands the agent the previous Results and the
reviewer's feedback.

**Files changed**

- `svelte-todo-kanban` (pushed to main, `e575f3e`): created `src/lib/server/cardThread.ts`,
  `src/lib/server/__tests__/cardThread.test.ts`; modified
  `src/routes/api/github/write-task-file/+server.ts`,
  `src/routes/api/github/update-task-file/+server.ts`,
  `src/routes/api/github/__tests__/write-task-file.test.ts`, `package.json` /
  `package-lock.json` (0.22.0 → 0.23.0).
- This repo: created follow-ups `doc/todo/068-liveRunStatusOnCard.md`,
  `069-proofOfWorkScreenshots.md`, `070-reviewCheckpoints.md`,
  `071-prReviewFeedbackRework.md`, `072-retryKnowsLastAttempt.md`,
  `073-stopRunWhenCardLeaves.md`; this file renamed to `-DONE.md`; `package.json` patch bump.

**Verification**

- `svelte-todo-kanban` `npm run check`: 0 errors, 0 warnings.
- `svelte-todo-kanban` vitest (all projects): 32 files, 365 tests passed. New tests cover
  formatting, the note filter, HTML flattening, replace-not-repeat, a re-queued card's fresh
  file, and the draft rename.
- Prettier and eslint clean on the touched files.
- Hasura: `todos.comments` and `comments.user` relationships confirmed in metadata. The
  endpoint queries as admin.
- E2E not run: the change is a server endpoint that writes to GitHub, which the Playwright
  suite does not exercise.
- Vercel production deploy of `e575f3e`: success.

**Deviations** — The task asked only for research and a plan. Following `/todo`'s "planning"
class, one slice was built: the rework loop. It lives in `svelte-todo-kanban`, not this repo,
as with #55 / #64.
