> Run with: Opus 5.5 / high
> Machine: dell

# Archiving and restoring from archive

## Original Requirement

[NEVER REMOVE]

Eg. repo `kusp` - I have archived it but it was still on Mac and I'm sure on other machines too. I manually deleted from Mac and now it says it's blocked because the work tree is not clean. Probably because I deleted the repo from Mac. Now make sure that everything is cleaned up and deleted from all machines when the Kanban board is deleted or archived. And if it's restored from archive then it should be again added to the all machines.

_From Kanban card `7170b082-e54a-482a-a691-e1c973e7145d`, moved to the agent list._

_GitHub issue #65 — end the commit subject with `(#65)`._

## Results

**Summary** — The runners only knew how to add a repo. Onboarding skips archived boards, but
nothing ever took a repo away again. So `kusp` (archived Oct 26), `raamatu-aasta` and
`krobe-eshop` (both archived) stayed cloned and watched on every machine. On the Mac you had
deleted the `kusp` folder, so preflight reported it as blocked ("missing") on every sweep.

Fixed in `klarity-claude-kit` `8effd2a` (runner 0.24.0). The new `src/offboard.js` runs at the
start of every board sweep on each machine (Mac, Karel, Dell, Windows WSL):

- **Archived or deleted board** → the repo's `config.json` entry is dropped, its blocked
  state is cleared, and the clone is deleted. A deleted board leaves no database row behind.
  So the runner remembers which repos had a live board on its last sweep (`boarded` in
  `state.json`). A repo added to `config.json` by hand, with no board, is never touched.
- **Safety** → the clone is kept, and only unwatched, if it holds work that is not on GitHub:
  uncommitted changes, commits on no remote, a stash, or an open worktree. The phone gets
  `Runner － repo removed` with the reason. A sweep that reads no live boards at all is
  treated as a broken read, and nothing is removed.
- **Secrets** → gitignored `.env*`, `hasura/config.yaml` and `.secrets/` are first copied to
  `~/.kanban-runner/archived/<owner>__<repo>/`. This matters because the Mac is the only
  source of secrets for the peers.
- **Restore from archive** → no extra step. The repo is no longer in `config.json`, so the
  next sweep onboards it as a new board: it is cloned again and the saved secrets are put
  back (`restoreSecrets` in `onboard.js`).
- `npm run check` now lists the repos it would remove.

**Files changed**
- `klarity-claude-kit/plugins/dev-kit/runner`: created `src/offboard.js` and
  `test/offboard.test.js`. Modified `src/run.js` (`retire()` in the sweep, plus a `--check`
  line), `src/onboard.js` (restores secrets), `src/secrets.js` (`saveSecrets`,
  `restoreSecrets`), `src/state.js` (`boarded`), `README.md` (new section "Archive or delete
  a project", plus the notification and file tables), and `package.json` (0.24.0).
- This repo: this task file.

**Verification**
- Runner `npm test`: 152/152 pass. The 6 new tests cover: an archived board, a deleted
  board, a hand-added repo, a live board and an archived board on the same repo, an empty
  read, a clean clone vs. dirty or unpushed work, a dry run, and the secrets coming back on
  restore.
- Dell `node src/run.js --check` against the live Kanban:
  `kasparpalgi/kusp`, `krobekarss/krobe-eshop` and `kirjandus/raamatu-aasta` would be
  removed, and all three clones are clean. No other repo is affected.
- Live rollout, checked over ssh after the runners self-updated to `8effd2a`:
  - **Karel** and **Windows WSL**: all three clones are deleted and gone from `config.json`.
    Secrets for `kusp` and `raamatu-aasta` were saved under `~/.kanban-runner/archived/`.
    `krobe-eshop` had none.
  - **Mac**: all three entries are gone from `config.json`. The clones were already missing
    there, so the `kusp` "missing" block is cleared.
  - **Dell**: it was running this task, so it picks up 0.24.0 on its next self-update and
    then cleans up the same three repos. The dry run above shows that plan.

**Deviations** — None. This repo's `package.json` is not bumped, because no code changed here.
