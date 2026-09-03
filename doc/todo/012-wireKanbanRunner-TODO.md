> Run with: Sonnet 5 / medium

# Wire the Kanban runner to the real board and keep it running

## Original Requirement

[NEVER REMOVE]

Split out of `009`, which built `plugins/dev-kit/runner/` and verified it against a stub
Hasura. This file is the "point it at the real thing" half. Needs a human at the keyboard
for the board edits and the admin secret.

## Steps

1. **Board columns.** On the Kanban board(s) you want automated, make sure the columns
   `TODO`, `Doing`, `Review` and `Blocked` exist (names are configurable in `config.json` if
   yours differ). Each board must also have its GitHub repo connected — that `owner/repo` is
   the key the runner maps to a local clone.
2. **Config.** `cp plugins/dev-kit/runner/config.example.json plugins/dev-kit/runner/config.json`,
   set `endpoint` (`http://localhost:3001/v1/graphql` locally, `https://todzz.eu/v1/graphql`
   live) and fill `repos` with every `owner/repo` → clone path you want runnable.
3. **Live `--check`.** `HASURA_ADMIN_SECRET=… npm run check` in `plugins/dev-kit/runner`.
   This is the first time the three GraphQL documents hit a real Hasura — `009` only
   validated them against the metadata YAML, so expect to fix field names here if anything
   was misread (`todos.list.board.lists`, `update_todos.affected_rows`,
   `insert_comments_one`). Every card should print a real clone path and no missing columns.
4. **One real card, end to end.** Put a small, safe task in Backlog, move it to TODO, watch
   `npm start`. Assert: card lands in Doing, `doc/todo/NNN-*.md` appears in the repo, the
   card ends in Review with a comment naming the file, and the commit SHA line is accurate
   (repos whose `CLAUDE.md` forbids committing must say `uncommitted`, not a stale SHA).
5. **Failure path.** Point a card at a repo path that does not exist, confirm it lands in
   Blocked with the tail of the output rather than hanging in Doing.
6. **Keep it up.** A launchd agent (`~/Library/LaunchAgents/eu.todzz.kanban-runner.plist`)
   with `RunAtLoad` + `KeepAlive`, `HASURA_ADMIN_SECRET` in `EnvironmentVariables`, stdout
   and stderr to `~/Library/Logs/kanban-runner.log`. Document the load/unload commands in
   the runner README.

## Verification

- [ ] `npm run check` lists real repo paths for every card, no missing columns
- [ ] A real card round-trips TODO → Doing → Review with an accurate comment
- [ ] A failing card lands in Blocked, never stuck in Doing
- [ ] Moving the same card to TODO twice runs it once (claim is `affected_rows`-guarded)
- [ ] `launchctl kickstart` survives a logout/login
- [ ] `config.json` and the admin secret are not committed

---

## Rescoped by the second pass of `009`

**This is personal tooling, not the product.** The product path is `014` (todzz.eu writes
the task file) + `016` (the push webhook closes the loop); `015` then rewrites this runner
to watch the local clone and drop Hasura entirely. Do this file only if you want the
auto-start working on your own Mac before `014` lands.

**Step 3 is done.** The three GraphQL documents were run against the live instance
(`todzz.admin.servicehost.io`, credentials from `../svelte-todo-kanban/.env`): `PENDING`
returns real cards, `CLAIM` no-ops on a non-matching `WHERE`, `REPORT` reaches execution and
fails only on the `comments_todo_id_fkey` foreign key. No field names were misread and no
schema change was needed.

Three fixes landed with it, which change what steps 1–2 must say:

- **`repos` is now load-bearing, not a convenience.** The query is scoped to the `owner/repo`
  keys in `config.json`; an empty `repos` is a startup error. Without it the admin secret
  returns all 49 users' cards.
- **Step 1's column names were wrong for the real boards.** `TODO / Doing / Review / Blocked`
  do not exist on most boards — mine has `Backlog / Later / Sooner`. Set `lists` in
  `config.json` to whatever your board actually uses, or rename the columns.
- **One card per poll.** `Sooner` held 91 cards; the old loop would have started 91 Claude
  sessions in a row.

Steps 4, 5 and 6 (a real card round-trip, the failure path, launchd) still need a human.
