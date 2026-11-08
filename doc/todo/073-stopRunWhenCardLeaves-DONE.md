> Run with: Opus 5.5 / high
> Machine: dell

# Stop a running task when its card leaves the agent list

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Stop a running task when its card leaves the agent list

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. Since #51, dragging a card out of the agent list renames its `-TODO.md`back to a draft, but only a task that has not started yet. A run already in its pane keeps going, then commits and moves the card to Review anyway. Symphony reconciles every tick: an issue that leaves the active states has its agent stopped. Itervox pauses on the same signal.

- While a task's pane is live, the runner checks on its normal poll whether origin still has the `-TODO.md` (a fetch, not a pull). If the file went back to a draft or was deleted, it stops the pane, parks the work in a stash as "⚠ did not finish" does, and sends `Runner ⏹ stopped — card left the agent list`.
- Find out first whether the tick loop can check while a run is in progress, or whether `herdr.js` blocks it.

## Acceptance criteria

- [ ] Moving a running card to Backlog stops its agent within one poll, with the work stashed.
- [ ] Moving it back re-queues it normally.

*GitHub issue #73 — end the commit subject with* `(#73)`*.*

_From Kanban card `e3f773f4-b814-4b3b-b434-1e68025ff27a`, moved to the agent list._

_GitHub issue #73 — end the commit subject with `(#73)`._

## Results

**Summary** — A run now stops when its card is dragged out of the agent list.

- **Can the tick loop check during a run?** No. `tick()` is sequential and `runRepo` awaits `runInHerdr`. That function sits in a single `herdr agent prompt --wait --timeout <taskMinutes>` call (240 min by default), so no tick runs until the run ends. The check therefore runs inside the run: a watcher (`src/leave.js`) starts next to `runTask` and stops when it returns.
- **The check:** every `pollSeconds`, plus once at the start, it does `git fetch` of origin's base branch into a private ref `refs/kanban-runner/<base>`. It uses `--no-write-fetch-head` and `--refmap=`, so it never pulls, never moves `origin/*` and cannot race the agent's own `git pull` for a ref lock. Then it runs `ls-tree` on the task folder. The card has "left" when origin has no `-TODO`, `-DONE` or `-BLOCKED` file for the stem, meaning it went back to a draft or was deleted. It only fires after the task was seen on origin first, so a local-only `/plan` task is never stopped. An origin it cannot read counts as unknown, never as gone.
- **Stopping:** herdr has no `agent stop`, so the runner reads the pane and then closes its tab. Measured on the real herdr: a pending `agent wait` does **not** return when its tab closes. It answered `agent_not_running` only at its own timeout (300 s in the probe, which would be `taskMinutes` in a run). So an `AbortSignal` now also kills the runner's blocking herdr CLI calls (`execFile` `signal`). The headless and aider paths get the same signal through `spawn`.
- **After the stop (base-branch repo):**
  - Commits the agent made but never pushed are soft-reset onto `origin/<base>`. Otherwise the next preflight would push them.
  - Everything is stashed. The card's status comment reads `⚠ Did not finish · card left the agent list`.
  - The phone gets `Runner ⏹ stopped — card left the agent list` with the stash SHA and `git stash apply <sha>`.
  - The attempt is given back.
  - The next tick finds a clean tree and pulls the draft. Moving the card back writes a fresh `-TODO`, which queues normally.
- **After the stop (pull-request repo):** the worktree's dirt is stashed and the worktree closed. Its local branch keeps any commits, and `openWorktree` resumes from them when the card comes back.

**Files changed** — in `klarity-claude-kit` `c9203a7`, `plugins/dev-kit/`:
- created `runner/src/leave.js` (`onList`, `watchCard`, `unpush`) and `runner/test/leave.test.js`
- modified `runner/src/herdr.js` (signal threaded into `hx`/`waitFor`/`promptAgent`, tab closed on abort, pane read before the close) and `runner/src/run.js` (watcher around `runTask`, signal into `shell`, the stop branch, `park()` stashes in `cwd`)
- modified `runner/test/herdr.test.js` and `runner/README.md` (Guards row)
- versions: `runner/package.json` 0.28.0 → 0.29.0, `.claude-plugin/plugin.json` 0.23.0 → 0.24.0

In this repo: this file and `package.json` (0.18.0 → 0.19.0).

**Verification**
- Runner `npm test`: 200/200 pass, 8 of them new. They check that:
  - a draft or deleted file on origin reads as "left", and an agent's `-DONE` does not
  - the fetch leaves the clone's tree and `origin/main` untouched
  - an unreadable origin reads as unknown
  - `onLeft` fires once, only after the task was seen on origin
  - `unpush` turns commits into staged work
  - an aborted herdr run closes its tab and returns at once even though `agent prompt` is still blocking, with `live: false` and the pane text kept
- `node src/run.js --check` runs clean.
- Real herdr probe (a throwaway `probe-73` tab, no prompt sent): closing the tab did not end a pending `agent wait` before its timeout. That result is why the signal kills the runner's own CLI calls.
- Not seen end to end yet: dragging a live card to Backlog on the board. The first real one will log `⏹ <file> — its card left the agent list, stopping the run`.

**Deviations**
- A pane left running after `taskMinutes` ran out (#60, "left alone") is not watched. By then the runner no longer waits on it, so this watcher has already stopped. It is rare, given the 240-minute budget.
- The card status uses the existing `⚠ Did not finish` kind with a note, not a new `⏹` kind. The Kanban's `cardThread.ts` only strips the known prefixes from a re-queued file.
