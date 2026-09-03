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