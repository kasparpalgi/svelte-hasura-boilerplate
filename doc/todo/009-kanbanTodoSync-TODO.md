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
