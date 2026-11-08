> Run with: Opus 5.5 / high
> Machine: dell

# A retry knows why the last attempt failed

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# A retry knows why the last attempt failed

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. When a run ends with a dirty tree, the runner stashes the work ("⚠ did not finish") and attempt 2 starts from a clean tree knowing nothing about attempt 1. Symphony passes `attempt` into the prompt ("resume from the current workspace state, do not repeat finished investigation"). Lisa injects past failures into the next prompt as guardrails.

- On attempt 2, the prompt says how attempt 1 ended: the reason (dirty paths, stuck, usage wall), the stash ref holding its work, and the `NNN-slug.log` path.
- Constraint: do **not** write this into the task file. Editing it resets the attempt count, and the run would loop forever. It belongs in the prompt (`/todo NNN` arguments, or the herdr prompt text). Check how `/todo` treats extra arguments first.

## Acceptance criteria

- [ ] Attempt 2's prompt names attempt 1's ending and stash ref; attempt 1's prompt is unchanged.
- [ ] Runner test covers both prompts.

*GitHub issue #72 — end the commit subject with* `(#72)`*.*

_From Kanban card `c2928d46-8ad1-447d-8837-74a2e8233432`, moved to the agent list._

_GitHub issue #72 — end the commit subject with `(#72)`._

## Results

**Summary** — From attempt 2 on, the runner tells the session how the previous attempt ended. The note goes into the `/todo` arguments, never the task file:

`/todo 072 This is attempt 2. Attempt 1 ended: <reason>. Its uncommitted work is in stash commit <sha>, see it with git stash show -p <sha> and take it with git stash apply <sha>. Its transcript is <repo>/doc/todo/072-slug.log. Resume from that state, do not repeat finished investigation.`

- Attempt 1, or any attempt with nothing on record, still gets the bare `/todo NNN`.
- Endings recorded:
  - a non-zero exit or an agent that never started, plus its stash
  - a dirty finish: whether the file was renamed and how many files were left uncommitted, plus its stash
  - in pull-request repos: "nothing committed on its branch", or "branch did not ship, work still in worktree <path>"
- The stash is named by its commit SHA instead of `stash@{0}`, because that index moves as soon as anything else is stashed.
- A usage wall gives its attempt back, so it never produces an attempt 2. Nothing is recorded for it.
- The ending is stored on the task's `tries` entry in `~/.kanban-runner/state.json`. A human edit to the task file (a new mtime) and the prune of a finished task both drop it along with the count.
- How `/todo` treats extra arguments: `$ARGUMENTS` expands to the whole string, so "file starting with `$ARGUMENTS`" would have broken. The skill now uses `$ARGUMENTS[0]` for the number. A new "A retry" paragraph tells it to read the note, check the stash before redoing work, and never copy the note into the task file. The note is reduced to plain words because Claude Code splits arguments shell-style; quotes, `;`, `#` and `$` are dropped.

**Files changed** — `klarity-claude-kit` `f6387ce`:
- created `plugins/dev-kit/runner/src/retry.js` and `test/retry.test.js`
- modified `src/run.js` (builds the prompt, records endings, `park()` returns the stash SHA), `src/state.js` (`setLast` / `lastEnding`, and `addTry` keeps the ending), `README.md`, `skills/todo/SKILL.md`, `runner/package.json` (0.27.0 → 0.28.0) and `.claude-plugin/plugin.json` (0.22.0 → 0.23.0)
- this repo: this file and `package.json`

**Verification**
- Runner `npm test`: 192/192 pass, 7 of them new. They check that:
  - attempt 1's prompt is unchanged even with an ending on record
  - attempt 2 names the ending, the stash commit and the transcript
  - characters that break the split are stripped
  - the ending survives the next `addTry` and drops on a human edit or a prune
- `node src/run.js --check` runs clean.
- Live check of argument expansion: a throwaway skill run through headless `claude -p` (Haiku) printed `FIRST=[072]` for `$ARGUMENTS[0]`, and the full note for `$ARGUMENTS`.
- Not seen end to end yet: the first real attempt 2 will show `told: /todo …` in the runner log.

**Deviations**
- No note for a usage wall (see above). The runner already gives that attempt back.
