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

## Results

**Summary** — Rewrote the kanban-runner in `klarity-claude-kit` to drop Hasura entirely. The new runner polls local git clones with `git pull --ff-only`, finds unfinished `NNN-*-TODO.md` files (no matching `NNN-*-DONE.md`), classifies the tier from the `> Run with:` frontmatter line, runs `claude -p /todo NNN`, and pushes if HEAD advanced. Deleted `hasura.js` and `taskfile.js`; rewrote `config.js` and `run.js`; simplified `classify.js`.

**Files changed** (in `klarity-claude-kit`):
- `plugins/dev-kit/runner/src/run.js` — rewritten (~100 lines, was 364)
- `plugins/dev-kit/runner/src/config.js` — rewritten (no Hasura, no secret)
- `plugins/dev-kit/runner/src/classify.js` — removed dead `childEnv` / `HASURA_ADMIN_SECRET` filter
- `plugins/dev-kit/runner/src/hasura.js` — deleted
- `plugins/dev-kit/runner/src/taskfile.js` — deleted
- `plugins/dev-kit/runner/config.example.json` — simplified
- `plugins/dev-kit/runner/README.md` — rewritten
- `plugins/dev-kit/runner/package.json` — bumped to 0.3.0

**Verification**:
- [x] A pulled `*-TODO.md` triggers exactly one run — `findPending` returns first unfinished TODO; tick returns after first runRepo that does work
- [x] Same file not re-run after restart — DONE rename is the marker; verified by assertion tests
- [x] Dirty/diverged clone skipped — `git status --porcelain` check before pull; `--ff-only` + code check on pull
- [x] No Hasura credential anywhere in runner — grep confirmed clean
- [x] Repos whose CLAUDE.md forbids committing left uncommitted and reported — HEAD before/after comparison, honest log line

**Deviations** — None
