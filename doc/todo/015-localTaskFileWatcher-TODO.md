> Run with: Sonnet 5 / medium

# Drop Hasura from the runner: watch the local clone instead

## Original Requirement

[NEVER REMOVE]

From the second pass of `009`:

> The runner is **layer ②-optional**: a personal auto-execute daemon, not the product. Once
> layer ① exists it should drop Hasura entirely and watch the local clone for a new
> `*-TODO.md` after `git pull` — no admin secret on any user's machine, and roughly 60 lines
> instead of 364.

**Blocked on `014`.** Until the server writes the task file there is nothing to watch, so do
not start this one first.

## Design

Replace `plugins/dev-kit/runner/src/{hasura,config}.js` and most of `run.js` with:

1. `git pull --ff-only` in each configured clone, on an interval.
2. Any `doc/todo/NNN-*-TODO.md` that appeared in that pull and has no matching run marker →
   run it.
3. `claude -p "/todo NNN" --model … --effort … --dangerously-skip-permissions` in that repo.
   `classify.js` and the `> Run with:` line survive unchanged — `014` writes that line, so
   the classifier may end up server-side and this keeps only the reader.
4. The `/todo` skill already renames to `-DONE.md` and appends `## Results`; push the result.
   The rename **is** the marker — no state file, no database.
5. Card and issue updates are `016`'s job (the push webhook), not this process's.

Delete rather than keep: the admin secret, `_similar` repo scoping, `limit`, `CLAIM`,
`REPORT`, the `lists` config block. All of it exists only to talk to Hasura.

## Watch out for

- A dirty working tree must skip the repo, not force anything.
- `--ff-only` so a diverged branch stops rather than merges.
- Still one card at a time — the reason for the per-tick limit in `009` has not changed.
- This stays **opt-in personal tooling**. The product path is `014` + `016`, and a user who
  never installs this must lose nothing but the automatic start.

## Verification

- [ ] A pulled `*-TODO.md` triggers exactly one run
- [ ] The same file is not re-run after restart (the `-DONE.md` rename is the marker)
- [ ] A dirty or diverged clone is skipped with a log line, never forced
- [ ] No Hasura credential appears anywhere in the runner
- [ ] Repos whose `CLAUDE.md` forbids committing are left uncommitted and reported honestly
