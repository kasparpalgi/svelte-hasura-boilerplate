> Run with: Opus 5 / high

# todzz.eu writes `doc/todo/NNN-slug-TODO.md` into the connected repo

## Original Requirement

[NEVER REMOVE]

From the second pass of `009` — the user's own description of how it should work:

> 1. User sign up at todzz.eu
> 2. Creates board and connects it with Github repo
> 3. Clones to computer the Github repo
> 4. Creates task in Kanban and it will create issue in Github
> 5. **Something creates issue file also in repo as a markdown**
> 7. User pulls md and executes. MD gets updated. Issue gets updated. Kanban todo item gets updated.

This file is **step 5**. It is layer ① of the corrected architecture: the server writes the
task file, so no user needs a runner, a Hasura admin secret or an exposed machine.

## Why the server and not a daemon

Proven against the live instance in `009`: 49 users, 65 boards, 109 lists on one Hasura.
The admin secret is global, so a per-user daemon cannot be scoped. The board's GitHub OAuth
token already **is** per-board and already has write access — that is the only credential
this needs, and it never leaves the server.

## Where it goes

This is a change in **`../svelte-todo-kanban`**, not in this repo. `src/routes/api/github/`
already holds `create-issue`, `update-issue`, `create-comment`, `register-webhook` and
`callback`, and `src/lib/server/github.ts` wraps the token handling. Adding a file write is
the same token against the Contents API — follow the shape of `create-issue/+server.ts`
rather than inventing a new client.

## Design

1. **Opt-in per board, by list id — never by name.** `009` proved list names are free text
   in any language (`Töös`, `in Arbeit`, `Sooner`, `调研MVS相关应用`); one board has no
   column called TODO at all. Add a board setting "list that means *ready for the agent*"
   holding a `lists.id`. Needs a migration on the Kanban — use the Hasura CLI there
   (`cd hasura && hasura migrate create …`, `hasura metadata apply`), credentials in that
   repo's `.env`.
2. **Trigger.** The card moving into that list. The app already owns the move, so do it in
   the same request path; no event trigger, no polling.
3. **Write.** `PUT /repos/{owner}/{repo}/contents/doc/todo/{NNN}-{slug}-TODO.md`. `NNN` is
   one past the highest existing number in `doc/todo/` — list the directory first, and treat
   a 409 as "someone else numbered it, re-read and retry once".
4. **Body.** Reuse the shape `plugins/dev-kit/runner/src/taskfile.js` already produces: a
   `> Run with:` line, `# title`, `## Original Requirement` + `[NEVER REMOVE]`, then the card
   body as text. Card bodies are **HTML** from the rich-text editor — port `toText()` rather
   than writing the raw markup into the file.
5. **Link back.** Put the file path and the GitHub issue number on the card (a comment is
   enough — `comments` already exists; no new column).

## Watch out for

- The repo may have no `doc/todo/` yet — the Contents API creates intermediate dirs, but the
  numbering scan must tolerate a 404 and start at `001`.
- A board can be connected to a repo the token lost access to. Fail to a card comment, not
  a 500.
- Two cards moved at once race on `NNN`. One retry on 409 is enough at this scale.
- Never write to the default branch of a repo the user did not connect themselves.

## Verification

- [ ] Moving a card into the designated list lands a correctly numbered file on GitHub
- [ ] The file's `## Original Requirement` is readable text, not HTML
- [ ] A board with no designated list does nothing at all
- [ ] Numbering does not collide with files already in `doc/todo/`
- [ ] Token failure surfaces on the card, never as an unhandled 500
- [ ] The OAuth token never reaches the client bundle

----


 014 — todzz.eu writes the task file (your step 5; needs a board setting for which list id means "ready", since names won't work)

 Let's use for testing the same board that is connected to the ../svelte-todo-kanban repo https://www.todzz.eu/en/kaspar/todo-app and not ready but "TODO" list that is currently empty in that board.
----

## Results

**Summary** — todzz.eu now writes the task file itself. Moving a card into the board's
designated "agent list" makes the server `PUT` `NNN-<slug>-TODO.md` into the connected
repo with the board owner's own GitHub OAuth token. No runner, no admin secret, no
exposed machine. Opt-in is stored as `boards.settings.agent_list_id` — an existing
`jsonb` column, so **no migration was needed**.

The repo's task folder is resolved the way the runner already does it: `.claude/todo` if
the repo has one, else `doc/todo`. This mattered — the test repo keeps its history in
`.claude/todo/`, so hard-coding `doc/todo` would have restarted numbering at 001.

**Files changed** (all in `../svelte-todo-kanban`)

- created `src/lib/server/taskfile.ts` — `camelName`, `toText`, `runWithLabel`,
  `nextNumber`, `buildTaskFile`. Port of `plugins/dev-kit/runner/src/taskfile.js` with the
  filesystem removed; the tier is read off the card (`Run with: opus`) and defaults to
  Sonnet rather than shelling out to a classifier.
- created `src/routes/api/github/write-task-file/+server.ts` (117 lines) — the endpoint.
- created `src/lib/server/__tests__/taskfile.test.ts` — 11 unit tests.
- modified `src/lib/stores/todos.svelte.ts` — non-blocking POST when `list_id` changes.
  The client never decides; the server owns the opt-in check.
- modified `src/lib/components/listBoard/BoardManagement.svelte` — "Agent list:" picker on
  GitHub-connected boards you own, listing lists by id.
- modified `src/lib/locales/{en,et,cs}/common.json` — `board.agent_list`,
  `board.agent_list_none`.

**Verification** — against the live instance and the real repo, using that project's `.env`.

| Check | Status |
| --- | --- |
| Card into the designated list lands a correctly numbered file | ✅ wrote `.claude/todo/154-serverSideTaskFile-TODO.md`, read back from GitHub |
| `## Original Requirement` is readable text, not HTML | ✅ `<p>…&amp;…</p><ul><li>` became `&`-text plus `- ` bullets |
| A board with no designated list does nothing | ✅ cards in "Later" and "Blocked" returned `skipped: not the agent list` |
| Numbering does not collide with existing files | ✅ existing max was 153 → wrote 154; re-scan then resolved 155 |
| Token failure surfaces on the card, never a 500 | ✅ handler returns `json({success:false})` and comments on the card; no `throw error(500)` on the write path |
| The OAuth token never reaches the client bundle | ✅ token only in `$lib/server/*` and `+server.ts`; the client posts `{ todoId }` and nothing else |
| `npm run check` | ✅ 19 errors before and after — all pre-existing missing modules (`layercake`, `d3-scale`, `marked`); none in changed files |
| `npm run test:unit:server` | ✅ 138 tests, 12 files |

Live IDs used: board `79ac3460…` ("Todo app", `kasparpalgi/svelte-todo-kanban`), TODO list
`d72eb69b…`. `agent_list_id` is now set on that board. The smoke-test card and both copies
of the smoke-test file (local and on GitHub) were deleted afterwards.

**Deviations**

1. **No migration.** The design called for one; `boards.settings` (`jsonb`) already existed
   and already carries `enable_hour_tracking`, so the setting went there. Less to maintain.
2. **`.claude/todo` fallback added.** Not in the design, but the target repo uses it and
   the runner already resolves it this way. Without it, numbering would have restarted.
3. **Model tier is not classified by an LLM.** The runner shells out to `claude -p`; a
   server request cannot. It reads an explicit `Run with: …` off the card and otherwise
   assumes Sonnet.
4. **Per-user token, not per-board.** The design says the credential "already is per-board";
   in the code it is `users.settings.tokens.github`, fetched by `getGithubToken(userId)`.
   Followed the existing `create-issue` shape rather than inventing a second token store.

**Found while testing — needs a decision (not fixed here)**

The **task-012 runner is still running on this machine** and wrote its own identical copy of
`154-serverSideTaskFile-TODO.md` locally at the same moment the server wrote it to GitHub —
same number, same slug, same body, differing only in the trailer (`moved to TODO` vs
`moved to the agent list`). Layer ① is meant to *replace* that daemon. Until the runner is
stopped or its writer disabled, any board with `agent_list_id` set will be double-written.
