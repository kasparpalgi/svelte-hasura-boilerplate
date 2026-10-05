> Run with: Opus 5.5 / high
> Machine: dell

# Doesn't pick the task

## Original Requirement

[NEVER REMOVE]

Created on Karel machine (the same where this task runs) a new #007 todo task in Kanban board and moved to the TODO list on repo tektok-app/tekdok-landing - check why didn't start, make it start and fix what was the problem.

_From Kanban card `35b73cc8-4246-4cbb-b5ac-7d499c8c988b`._

_GitHub issue #50 — end the commit subject with `(#50)`._

## Results

**Summary** — Root cause: the tekdok-landing card "Cookie concent" (#7) had its machine on
**Auto** (`agent_machine` null), so the server wrote `007-cookieConcent-TODO.md` with no
`> Machine:` line. The runner treated an unaddressed task as belonging only to the
`machineDefault` runner (the Mac). Dell and Karel skipped it (`--check` showed
`[→ unaddressed, not this machine]`), so it waited for the Mac, which had not picked it up.

- **Made it start:** claimed 007 for this machine (Dell/servo). Added `> Machine: dell` to the
  task file (tekdok-landing `d5d96f3`) and set the card's `agent_machine` to `dell`. `--check` now lists it
  as this machine's pending task, so the runner picks it up as soon as this run ends.
- **Fixed the cause** (klarity-claude-kit `4f417db`, runner 0.21.0): Auto now means "the first free
  runner". Any runner with a `machine` takes unaddressed tasks, but first claims one by writing
  its own `> Machine:` line, committing and pushing it. A push is atomic, so of two racing
  runners exactly one lands; the loser resets its claim commit and pulls the winner's line.
  The claim also sets the card's machine. `machineDefault` is now ignored.
- The comment in svelte-todo-kanban `taskfile.ts` is updated to match (`05aec08`).

**Files changed**
- klarity-claude-kit `plugins/dev-kit/runner/`: created `src/claim.js` and `test/claim.test.js`. Modified
  `src/machine.js`, `src/run.js`, `src/config.js`, `config.example.json`, `README.md`,
  `test/machine.test.js` and `package.json`.
- svelte-todo-kanban: `src/lib/server/taskfile.ts` (comment only)
- tekdok-landing: `doc/todo/007-cookieConcent-TODO.md` (claim line)
- this repo: this task file, `package.json` (version bump)

**Verification**
- Runner `npm test`: 112/112 pass. This includes a new race test with a bare origin and two clones:
  exactly one claim wins, and the loser ends up clean and pulls the winner's line.
- `node src/run.js --check` on Dell: 007 is now pending for this machine.
- No app code changed in this repo, so I did not run `npm run check` or the tests here.

**Deviations** — None. Runners pick up the new code through self-update within about 10 minutes.
