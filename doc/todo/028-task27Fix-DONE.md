> Run with: Opus 5 / high

# Task #27 fix

## Original Requirement

[NEVER REMOVE]

Not sure what happened there as I don't have here in board option to choose in which machine to run it. Also, last Vercel deploy at `svelte-todo-kanban` repo I see is 2 days ago and #27 sits still in the TODO list not Review so I suspect it was not finished.

_From Kanban card `c7565488-7f74-4498-8d47-8029f3ee1d79`._

_GitHub issue #28 — end the commit subject with `(#28)`._

---

## Results

**Summary** — Both halves of the card are answered: the board can now pick the machine,
and the reason #27 never left TODO turned out to have nothing to do with #27.

*"#27 sits still in the TODO list not Review so I suspect it was not finished."* — it was
finished. `b348e1d` renamed `027-…-TODO.md` to `027-…-BLOCKED.md` exactly as the
contract wants, and `findTaskFileRenames` would have matched that pair. Nothing was
listening. **This repo had no GitHub webhook registered at all**, and the board's whole
inbound direction was dead: zero `github_commit` activity logs and zero "Task complete"
comments across the entire database, for every repo, ever. `handleTaskFileDone` — the
DONE→Review move, the completion comment, the issue close — had never run in production
once since it was written.

Three faults stacked, each of which alone was enough:

1. `GITHUB_WEBHOOK_SECRET` was absent from Vercel in all environments. Inbound
   deliveries 401, and `/api/github/register-webhook` refuses to register anything, so
   the feature could not even be switched on from its own UI.
2. No webhook existed on `kasparpalgi/svelte-hasura-boilerplate` (confirmed: `hooks`
   returned an empty list).
3. `register-webhook` built its callback from `PUBLIC_APP_URL`, which is the apex
   `todzz.eu`. That 307s to `www.todzz.eu`, and **GitHub does not follow redirects on a
   delivery** — it records the 3xx and moves on. So even once 1 and 2 were fixed, a hook
   registered through the UI would have failed silently forever. Fixed the way the OAuth
   `redirect_uri` was fixed in #195: derive it from the real request origin.

The proof is in the hook's own delivery log: the ping GitHub sent at creation (before
the secret was live) came back **401**; the ping after the deploy came back **200 OK**.

*"last Vercel deploy at `svelte-todo-kanban` I see is 2 days ago"* — correct, and
expected. #27's work landed in `klarity-claude-kit` and `server`; it never touched the
kanban app, so there was nothing to deploy. The machine picker is the part that lives
there, and it is what deployed today.

*"I don't have here in board option to choose in which machine to run it"* — that was
`030-machinePickerOnTheCard.md`, the board half deliberately split out of #27. Built and
shipped here. Auto writes no `> Machine:` line at all, because an unaddressed file is
what `machineDefault` claims; emitting a name for auto would change which box runs it.

**Files changed**

*`svelte-todo-kanban`* (commit `05a7577`, `0.16.0 → 0.17.0`)

- created `hasura/migrations/default/1804000000000_add_agent_machine_to_todos/` —
  `agent_machine text` + a CHECK constraint on `('mac','karel')`. The constraint is the
  point: a card naming a machine no runner answers to produces a task file that runs
  nowhere, silently. Numbered `1804…` because this repo's later migrations use synthetic
  versions above real epoch ms, and a real `Date.now()` would have sorted mid-history.
- modified `src/lib/server/taskfile.ts` — `machineSlug`, `machineLine`, a shared
  `header()` for the 0-2 `>` lines, and `ensureMachine`
- modified `src/lib/graphql/documents.ts`, the three `api/github/*-task-file` /
  `write-draft-file` queries, `generated/*` (codegen)
- modified `src/routes/api/github/register-webhook/+server.ts` — origin-derived callback,
  path-based "is this ours" match, dropped the now-unused `PUBLIC_APP_URL` guard
- modified `CardDetailView.svelte` (picker + the three field paths), `cardHelpers.ts`
  (zod enum), `types/todo.ts` (`AgentMachine`), `todos.svelte.ts`, `locales/{en,et,cs}`
- modified `hasura/metadata/…/public_todos.yaml` — select/insert/update permissions
- modified `src/lib/server/__tests__/taskfile.test.ts` — 10 new tests

*this repo*

- created `doc/todo/032-orphanedDraftFiles.md` — a real bug found on the way in
- deleted `doc/todo/031-task27Fix.md` — the orphaned duplicate draft of this very card

*not in any repo* — `GITHUB_WEBHOOK_SECRET` added to Vercel production/preview/development
and to the local `.env`; webhook `683449900` registered on this repo
(`https://www.todzz.eu/api/github/webhook`, events `issues`, `issue_comment`, `push`).

**Verification**

| Check | Result |
| ----- | ------ |
| `npx vitest run --project server` | 263 pass / 21 files, 10 of them new |
| `npm run check` | 17 errors, 6 warnings — **identical to the pre-change baseline** (verified by `git stash`); none introduced here |
| `npx vitest run` (all projects) | client project cannot run: Playwright browsers not installed locally, pre-existing (`npx playwright install`) |
| `hasura migrate status` | `1804000000000` Present/Present |
| CHECK constraint, live DB | `karel` accepted, `nope` rejected with `todos_agent_machine_check`, `null` accepted |
| Vercel | `dpl_H49VTu5AtCcMY6JJmhKTXCaC2zuB` Ready, aliased to `www.todzz.eu` |
| Webhook delivery | ping before deploy **401**, ping after deploy **200 OK** |
| Card #27 | now in **Review**, completion comment posted, issue #27 closed |

**Deviations**

- **The webhook fix was not in the plan.** `030` scoped only the board half. The card's
  other half could not be answered without finding out why the move never happened, and
  the answer was three unrelated faults in the inbound path. Fixed rather than reported,
  because the diagnosis was worthless on its own — the automation would have kept
  failing silently.
- **Card #27 was moved by hand**, not by the automation. The webhook only fires on new
  pushes and `b348e1d` is in the past, so there was no delivery to replay. What was done
  by hand is exactly what `handleTaskFileDone` does: move to Review, post the completion
  comment, close the issue. The *next* rename — this file's — is the first real end-to-end
  test of the repaired path.
- **BLOCKED still moves to Review, not to the board's "Blocked" list.** That is what the
  shipped code does for both `-DONE` and `-BLOCKED`, and it is the list the card expected
  ("not Review"). Left alone; worth a decision later, since the board has a Blocked list.
- **`AgentModel` / `AgentEffort` in `types/todo.ts` are stale** — they predate the widened
  model/effort values and only compile because the call sites cast. Not touched; out of
  scope and the casts make it harmless today.
- **The machine picker has not been driven end to end through a real run.** The file
  side is unit-tested in both directions and the DB rejects bad values, but no card has
  been set to Karel and watched through `--check` on both boxes. That needs a real task
  and a free Karel; it is the one thing left to confirm by hand.
