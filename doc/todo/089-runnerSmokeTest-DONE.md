> Run with: Opus 5.5 / xhigh
> Machine: dell

# End-to-end smoke test for the runner

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# End-to-end smoke test for the runner

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

Runner changes ship to four machines at once, and a broken pickup shows up only as "it didn't start". Add one `node --test` case in `klarity-claude-kit/plugins/dev-kit/runner`that builds a bare origin + clone with one `001-x-TODO.md`, puts a fake `claude` on PATH that renames the file to `-DONE.md` and commits, runs `run.js --once` against a temp `config.json`, and asserts the file is `-DONE.md` on origin. No herdr, no Kanban.

Acceptance: `npm test` runs it in under 10 s, and breaking `listPending` fails it.

*GitHub issue #89 — end the commit subject with* `(#89)`*.*

_From Kanban card `30beaada-07e3-4541-b85c-94ad36f159aa`, moved to the agent list._

_GitHub issue #89 — end the commit subject with `(#89)`._

## Results

**Summary** — The runner now has an end-to-end smoke test:
`klarity-claude-kit/plugins/dev-kit/runner/test/smoke.test.js`, runner 0.31.1, kit commit
`7af4e2d`. It builds a bare `origin.git` and a clone holding one
`doc/todo/001-x-TODO.md`. The file starts with `> Run with: Sonnet 5 / low`, so no
classifier call is made. The test puts a fake `claude` on `PATH`. The fake checks that it
got `-p "/todo 001"`, renames that task to `-DONE.md` and commits. The test then runs the
real `node src/run.js --once` against a temp `config.json` (`useHerdr: false`, no
Kanban endpoint) and asserts that `doc/todo/001-x-DONE.md` is the only task file on
`origin/main`. So one tick covers pickup, worktree, the claude call, landing and the push.
If it fails, the assertion message shows the runner's full log.

It doesn't touch the machine it runs on. `HOME`, `KANBAN_RUNNER_CONFIG`/`STATE`/
`WORKTREES` and `CLAUDE_CONFIG_FILE` all point into a temp dir.
`PUSHBULLET_ACCESS_TOKEN` is empty and the git identity comes from env. A temp `HOME`
also keeps the machine's global git config (hooks, signing) out of the commits.

**Files changed**

- `klarity-claude-kit`: created `plugins/dev-kit/runner/test/smoke.test.js` (93 lines).
  Modified `plugins/dev-kit/runner/README.md` (a Notes line) and
  `plugins/dev-kit/runner/package.json` (0.31.0 → 0.31.1).
- This repo: modified `doc/how-it-works.md` (#89 marked built) and `package.json`
  (0.19.8 → 0.19.9). This task file renamed to `-DONE`.

**Verification**

- The new test alone passes in about 0.35 s. The full runner `npm test` passes 226/226
  in 6.2 s (5.8 s before), under the 10 s limit. It passed again after rebasing onto
  `origin/main`, before the push.
- Breaking `listPending` fails the test, checked two ways:
  - `return []` at the top fails it: `001-x-TODO.md` is still on origin.
  - A typo in the `-TODO` regex fails it too.
  - `src/queue.js` was restored after each check.
- Leak check after the full suite: no `smoke-` trust entry in `~/.claude.json`, no
  `o/smoke` in `~/.kanban-runner/state.json` and no worktree under
  `~/.kanban-runner/worktrees`.
- `claude plugin validate ./plugins/dev-kit`: passed.
- `prettier --check doc/how-it-works.md`: clean. No app code changed, so
  `npm run check` and the app's `npm test` weren't needed.

**Deviations**

- The work was done in a temporary worktree of the kit and pushed to `main` from there.
  The kit's live checkout on this machine runs the runner, so it was never edited. It is
  one commit behind until its self-update fast-forwards it.
- The assertion ignores `doc/todo/.gitignore`, which the runner commits on its own for
  the run's `.log`.
- Like the other git tests, the test leaves its `/tmp/smoke-*` dir behind.
