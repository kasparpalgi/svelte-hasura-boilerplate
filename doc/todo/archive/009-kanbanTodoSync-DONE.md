> Run with: Opus 5 / high

# Kanban ↔ `doc/todo/` two-way sync + auto-run on TODO

## Original Requirement

[NEVER REMOVE]

From `008`:

> I have a self-made Kanban board (Svelte/Hasura) where I like to create new items into
> Backlog column. Often on the go via voice input (it has voice input). Then when I move
> the task to TODO column then would be nice claude code spin it up, decide what
> model/effort if I don't set it and execute. I think PostgreSQL todo tasks must then sync
> 2-way between project's doc/todo folder? My Kanban already has GitHub integration but it
> creates a GitHub issue in the connected repo when I create new task.

Svelte Kanban lives at ../svelte-todo-kanban

## Verdict on the plan (from 008 research)

The plan is sound, with one correction: **don't sync two ways.** Two-way sync between a
Postgres table and a git-tracked folder means conflict resolution, and you will spend more
time on the sync than on the features. Make it one-way with git as the source of truth for
outcomes:

```
Kanban card → TODO column → Hasura event trigger → runner → claude -p "/todo NNN"
                                                              ↓
                                          doc/todo/NNN-*.md written + committed + pushed
                                                              ↓
                                     runner PATCHes the card: status, commit SHA, file link
```

The card carries the _request_; the repo carries the _work_. The card only ever receives a
status + a link back. That is one-way each direction, no merge conflicts.

Reuse the existing GitHub integration rather than replacing it: the issue it already
creates is a fine permanent home for the card's text, and the runner can close it.

## Analysis

- Hasura: `Backlog → TODO` transition needs an event trigger on the tasks table
  (`update` operation, column filter on status). Payload → webhook.
- Runner: a small always-on process (mini-PC / VPS / the dev machine) that receives the
  webhook, clones or pulls the target repo, writes `doc/todo/NNN-<slug>-TODO.md` from the
  card body, then runs `claude -p "/todo NNN" --dangerously-skip-permissions`.
- Model/effort selection when the card doesn't specify: a cheap classifier pass
  (`claude -p` with Haiku) that reads the card text and emits `Opus 5 / high`,
  `Sonnet 5 / medium` or `Haiku 4.5 / low`, written as the first line of the task file.
  The `/todo` skill already expects that line.
- Auth: the runner needs a Claude Code credential and repo push rights. Never put either in
  the Kanban app.
- Concurrency: several cards moved at once → queue, one worker per repo (git conflicts).

## Implementation Plan

1. Add `status`, `repo`, `model`, `effort`, `task_file`, `commit_sha` columns to the Kanban
   tasks table; migration + metadata.
2. Hasura event trigger `task_moved_to_todo` → webhook, with a shared-secret header.
3. Runner service (own repo, Node): webhook endpoint → queue → git pull → write task file →
   classify model/effort if unset → spawn `claude -p` → capture exit code and output.
4. On success: commit + push, then GraphQL mutation back to the card with the file path and
   commit SHA, and move the card to Review.
5. On failure: move the card to Blocked with the last 50 lines of output.
6. E2E test: create card via GraphQL, move to TODO, assert the file lands and the card
   reaches Review.

## Open decisions

- Where does the runner live? (dev Mac via Tailscale is the cheapest start.)
- Should voice-created Backlog cards get an automatic `/plan` pass before they are runnable?
  Probably yes — a raw voice dump is not a task file.

## Verification

- [ ] Migration applied, metadata applied
- [ ] Trigger fires only on Backlog→TODO
- [ ] Runner is idempotent when the same card is moved twice
- [ ] Secret never reaches the client bundle
- [ ] `npm run check` and tests pass

---

# Answers & session log

> This file was a design, and reading the actual Kanban schema changed three of its
> decisions. Below: what the schema forced, the two open decisions answered, then the
> slice built and the follow-ups filed.

## What reading `../svelte-todo-kanban` changed

**The plan's step 1 and step 2 are not needed at all.**

| The plan said                                            | The schema says                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Add `status` to the tasks table                          | There is no status. A column _is_ a `lists` row; "move to TODO" is a `todos.list_id` update. Nothing to add        |
| Add `repo` to the tasks table                            | `boards.github` already holds `{owner, repo, full_name}` from the GitHub integration. The runner maps that locally |
| Add `model` / `effort` columns                           | The card body can just say `Run with: opus`. Free-text, zero migration                                             |
| Add `task_file` / `commit_sha` columns                   | `comments` already exists. The outcome is a comment on the card — visible where you'd actually look for it         |
| Hasura event trigger + webhook + shared secret + a queue | See below                                                                                                          |

**Net: zero migrations, zero metadata changes to the Kanban.** The whole integration is
`lists`, `todos.list_id` and a `comments` insert — all of which already exist.

## Don't use a webhook. Poll.

An event trigger means Hasura must reach _in_ to the Mac: a public endpoint or a Tailscale
funnel, a shared secret on both ends, TLS, and a queue because webhooks arrive in parallel.
That is four moving parts protecting one user moving a few cards a day.

A poll every 20 seconds is **outbound only**, so it works from behind NAT with nothing
exposed, needs no secret handshake (just the admin secret in the Mac's env), and is its own
queue because it is one sequential loop. Latency is 20s instead of 1s, which for "start
working on this" is not a difference you can feel.

Idempotency comes free from the claim being a conditional update:
`UPDATE todos SET list_id = <Doing> WHERE id = $1 AND list_id = <TODO>`. Moving the same
card twice affects zero rows the second time.

## Open decision 1: where does the runner live?

**The dev Mac, as a launchd agent — and no Tailscale.** Tailscale was only in the plan to
let a webhook reach the Mac; polling removes the reason for it. The code lives in
`plugins/dev-kit/runner/`, so it travels with the rest of the cross-project workflow when
`010` extracts the plugin into its own repo. Wiring + launchd is filed as **012**.

-- So Mac is the server for every Kanban user? No good. If server needed use ../server repo and Karel servrer. I imagined it so:
1. User sign up at todzz.eu
2. Creates board and connects it with Github repo
3. Clones to computer the Github repo
4. Creates task in Kanban and it will create issue in Github
5. Something creates issue file also in repo as a markdown
7. User pulls md and executes.  MD gets updated. Issue gets updated. Kanban todo item gets updated. 
Or how it was meant to work?

One gap, stated plainly: the three GraphQL documents have never hit a real Hasura. They're written against the metadata YAML and the stub mirrors that shape, but the instance on :3001 is this boilerplate's, not the Kanban's, and none of the admin secrets on disk opened it. The first live --check is the real proof — that's step 3 of 012. ---- nono, see the kanban board .env and use HAsura CLI if schema changes or whatever in hasura side needed

## Open decision 2: `/plan` pass for voice cards?

**Yes, but gated by length, and on the way _out_ of Backlog, not into TODO.** A short card
that already says what to do should go straight to work; a rambling transcript should not.
`/plan` sharpens the card and leaves it in Backlog — you still make the move to TODO
yourself, so an AI never decides on its own that a voice note was ready to execute. Filed
as **013**.

## Results

**Summary** — Built the runner, the whole of steps 3–5 of the plan, in
`plugins/dev-kit/runner/`: ~325 lines of dependency-free Node across five files.

- Polls the Kanban's Hasura for cards in `TODO`, claims one by moving it to `Doing`
  (conditional update, so re-moves are no-ops), writes
  `doc/todo/NNN-camelName-TODO.md` in the mapped repo, and runs
  `claude -p "/todo NNN" --model … --effort … --dangerously-skip-permissions` there.
- Model/effort: `Run with: opus|sonnet|haiku` in the card wins; otherwise a
  `claude -p --model haiku` classifier picks a tier, defaulting to `Sonnet 5 / medium` if
  that call fails. The chosen tier becomes the task file's `> Run with:` line.
- Exit 0 → card to `Review` with a comment naming the file, and either the new commit SHA
  or the word `uncommitted` — a repo whose `CLAUDE.md` forbids committing must not be
  reported as committed, so HEAD is compared before and after the run.
- Non-zero, or any error after the claim → card to `Blocked` with the last 30 lines. No
  path leaves a card stranded in `Doing`.
- `npm run check` (`--check`) does a dry pass: resolves every card to a real clone path and
  names any missing column, running nothing.

**Files changed**

- Created: `plugins/dev-kit/runner/{README.md,package.json,config.example.json}`,
  `plugins/dev-kit/runner/src/{run,hasura,taskfile,classify,config}.js`,
  `doc/todo/012-wireKanbanRunner-TODO.md`, `doc/todo/013-planPassForVoiceCards-TODO.md`
- Modified: `.gitignore` (runner `config.json`), `plugins/dev-kit/README.md`,
  `plugins/dev-kit/.claude-plugin/plugin.json` (0.1.0 → 0.2.0), `package.json` (0.2.0),
  `doc/todo/010-extractDevKitPlugin-TODO.md` (the runner moves with the plugin)
- Deleted: none

**Verification**

- [x] End-to-end against a stub Hasura + a fake `claude` on `PATH`: poll → claim → task
      file (`001-addADarkMode-TODO.md`, correct `> Run with:` line, raw card text preserved)
      → `claude -p "/todo 001" --model haiku --effort low --dangerously-skip-permissions` in
      the right cwd → card to `Review`, comment `… — Haiku 4.5 / low, uncommitted.`
- [x] Failure path: fake `claude` exiting 3 → card to `Blocked` with the output tail
- [x] Claim race: second `Claim` returns `affected_rows: 0` and the card is skipped
- [x] `--check` prints the resolved clone path, and `UNMAPPED (owner/repo)` when absent
- [x] Config: `~/` expands, missing `HASURA_ADMIN_SECRET` fails loudly at startup
- [x] Unit-level: `camelName`, `nextNumber` (009 present → 010 next), `explicitTier`
- [x] `node --check` on all five files; `npx prettier --check` clean; ≤141 lines each
- [x] `claude plugin validate ./plugins/dev-kit` passes
- [ ] **The three GraphQL documents have never hit a real Hasura.** They are written
      against the metadata YAML (`public_todos`, `public_lists`, `public_boards`,
      `public_comments`) and the `comments` migration, and the stub mirrors that shape — but
      the local Hasura on `:3001` is this boilerplate's, not the Kanban's, and none of the
      admin secrets on disk opened it. First live `--check` in **012** is the real proof.
- [ ] `npm run check` / `npm test` — not run: no `src/` or app config touched

**Deviations**

- **Steps 1 and 2 of the plan were dropped, not deferred.** No migration, no event trigger,
  no webhook, no shared secret, no queue service — the schema already had everything, and
  polling removed the rest. Reasoning above.
- Two-way sync stayed rejected, as the plan's own verdict said.
- No `alias` / `github_issue_number` use yet. Closing the card's GitHub issue on success is
  a nice-to-have that needs a token in the runner; not worth it until the basic loop has
  run for real.

---

# Second pass — answering the two notes above

## "So Mac is the server for every Kanban user? No good."

Correct, and your seven-step flow is the right one. I had answered "where does the runner
live" as a personal-tooling question when it is a product question. Three facts from the
**live** Hasura (`todzz.admin.servicehost.io`, credentials from the Kanban's own `.env`)
settle it:

| Probe                                | Result                                                              |
| ------------------------------------ | ------------------------------------------------------------------- |
| `users` / `boards` / `lists`         | **49 / 65 / 109** — one shared instance                             |
| cards in a list literally named TODO | **28**, across other people's boards                                |
| distinct list names                  | `Todo`, `TODO`, `ToDo`, `todo`, `to do`, `Töös`, `in Arbeit`, `调研MVS相关应用`… |

So the polling design fails as a product on three counts, not one:

1. **It needs the admin secret.** That secret is global. Any user running it reads and
   writes all 49 users' boards. There is no per-user scoping to hand out.
2. **It needs the user's machine and their Claude credentials.** Karel cannot have either,
   and should not.
3. **"When a card enters TODO" is not expressible.** Column names are free text in any
   language. The board I have cloned locally has `Backlog / Later / Sooner` — no TODO at all.

### How it was meant to work — corrected

**GitHub is the bus.** The server never reaches into the user's machine, the user's machine
never exposes anything, and no secret crosses between them. Three layers:

```
① todzz.eu (server, all users)     card → GitHub issue  +  commit doc/todo/NNN-slug-TODO.md
                                      via the board's existing OAuth token
                                              ↓  user runs `git pull`
② the user's own machine           /todo NNN  →  file updated → -DONE.md → commit → push
                                              ↓  push event
③ todzz.eu webhook (already exists) card moves + comment with the commit SHA; issue closed
```

Layer ① is your step 5 and it is **not new infrastructure** — `src/routes/api/github/` in
the Kanban already creates issues, comments and webhooks with a per-board token. Writing a
file is the same token and the same code path (Contents API instead of Issues API). Layer ③
is your step 7's return leg, and `src/routes/api/github/webhook/+server.ts` is already
registered and receiving. **Karel is not needed.** todzz.eu is already the server.

Layer ② stays a human typing `/todo`. That is a feature, not a gap — it is also the honest
answer to open decision 2: an agent never decides on its own that a voice note was ready.

### What that makes of the code built in the first pass

The runner is **layer ②-optional**: a personal auto-execute daemon, not the product. Once
layer ① exists it should drop Hasura entirely and watch the local clone for a new
`*-TODO.md` after `git pull` — no admin secret on any user's machine, and roughly 60 lines
instead of 364. Filed as **015**. Until layer ① exists it is the only working path, so this
session made it *safe* rather than deleting it (below).

## "nono, see the kanban board .env and use Hasura CLI"

Done — that was the right correction, and `:3001` is the Kanban's own dev endpoint, not this
boilerplate's. I had that backwards. All three GraphQL documents are now proven against the
live instance, and **no schema change turned out to be needed**, so the Hasura CLI had
nothing to apply. The probes found three real defects instead:

| # | Found live                                                                            | Fix |
| - | ------------------------------------------------------------------------------------- | --- |
| 1 | `PENDING` had no board filter — with the admin secret it returned **other users' cards** | `boards.github` is a `String` (JSON text), so the query now takes a `_similar` alternation built from the config's `repos` keys. An unmapped repo returns 0 rows |
| 2 | `tick()` looped over **every** card in the column — 91 in my own `Sooner`, i.e. 91 Claude sessions back to back | `limit: $limit`; `tick` takes 1 per poll, `--check` shows 10 |
| 3 | Card bodies are **HTML** from the rich-text editor (`<p><a href=…>`) and went into the task file raw | `toText()` in `taskfile.js` — block tags to newlines, `<li>` to `- `, entities decoded; plain-text and voice cards pass through untouched |

`boards.github` being a JSON *string* rather than an object was already handled — that one
was a false alarm.

## Results (second pass)

**Summary** — Answered both notes with live evidence, corrected the architecture to
GitHub-as-bus, and hardened the runner against the three defects the live data exposed.

**Files changed**

- Modified: `plugins/dev-kit/runner/src/hasura.js` (repo scoping + `limit`),
  `plugins/dev-kit/runner/src/run.js` (`reposPattern`, one card per tick, empty-`repos`
  guard), `plugins/dev-kit/runner/src/taskfile.js` (`toText`), `doc/todo/012-*` (rescoped),
  `package.json`
- Created: `doc/todo/014-serverSideTaskFileWriter-TODO.md`,
  `doc/todo/015-localTaskFileWatcher-TODO.md`

**Verification** — against the live production Hasura, not a stub:

- [x] `PENDING` executes; returns real cards with `list.board.github` and `board.lists`
- [x] `CLAIM` executes, `affected_rows: 0` on a non-matching `WHERE` — no row written
- [x] `REPORT` reaches execution and fails on `comments_todo_id_fkey`, which proves the
      document is schema-valid; the transaction rolled back, so no comment was inserted
- [x] Scoping: mapped repo → 10 cards, all from that board; `nobody/does-not-exist` → 0
- [x] `toText` against the real HTML card body, a real plain-text checklist card, nested
      lists, entities and `null`
- [x] `node --check` on all five files; `npx prettier --check` clean; longest file 151 lines
- [ ] Steps 4–6 of `012` (a real card round-trip, launchd) — still needs a human
- [ ] `npm run check` / `npm test` — not run: no `src/` or app config touched

**Deviations** — The first pass's answer to open decision 1 ("the dev Mac") is **withdrawn**;
the runner is optional personal tooling, and the product path is server-side. Open decision 2
stands, and is now also enforced structurally: layer ② is a human.
