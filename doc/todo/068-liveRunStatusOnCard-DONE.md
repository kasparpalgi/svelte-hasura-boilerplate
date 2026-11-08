> Run with: Opus 5.5 / high

# Live run status on the card

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Live run status on the card

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59 (open-source agent Kanban comparison). While a task runs, the card says nothing until the Results comment lands; you have to open herdr to know anything is happening. OpenAI Symphony keeps **one persistent "workpad" comment** per issue that the agent edits as it goes; Lisa posts progress comments; Itervox has a narrative feed.

Build the cheap version in the runner (`klarity-claude-kit/plugins/dev-kit/runner`):

- When a run starts, post **one** card comment, e.g. `▶ Running on dell since 14:02 · Opus 5.5 / xhigh · attempt 1`.
- Edit that same comment (by id, `update_comments`) on the events the runner already knows: tier step-down on a usage wall, attempt 2, ⏸ needs you, ⚠ did not finish.
- On finish, mark it `■ Finished on dell 14:02–14:41 · $2.33` (cost from `sessionUsage.js`) — the Results comment stays separate, as today.
- Add the comment's prefix to the `NOTE` filter in `svelte-todo-kanbansrc/lib/server/cardThread.ts`, so the status line is not carried into a re-queued task file.

## Acceptance criteria

- [ ] A started run shows its status comment on the card within one tick.
- [ ] Exactly one status comment per run — edited, never re-posted.
- [ ] Runner tests cover post + edit; the Kanban `cardThread` test covers the new prefix.

*GitHub issue #68 — end the commit subject with* `(#68)`*.*

_From Kanban card `316f991b-7cca-4cfe-b0df-12d9c4bfe528`, moved to the agent list._

_GitHub issue #68 — end the commit subject with `(#68)`._

## Results

**Summary** — The runner now posts **one** status comment on the card when a run starts
(`▶ Running on dell since 14:02 · Opus 5.5 / xhigh · attempt 1`), before the pane opens, so
it shows up in the same tick. After that it edits the same comment by id
(`update_comments`) when something happens: `⏳ Waiting … · usage limit, back <time>`,
`⏸ Needs you` (pane blocked), `✘ Failed` (non-zero exit / no worktree / agent never
started), `⚠ Did not finish`, and `■ Finished on dell 14:02–14:41 · … · $2.33` with the cost
read from `recordUsage`'s line. The Results comment stays separate. A retry (attempt 2) or a
restarted runner takes over the comment the last unfinished attempt left. A `■ Finished` one
is kept, so a card sent back for rework gets a new line. If a status call fails, it is
logged and the run carries on.
The Kanban's `cardThread.ts` `NOTE` filter drops these prefixes, so status lines are not
carried into a re-queued task file.

**Files changed**
- `klarity-claude-kit` `4be2e8f`: created `plugins/dev-kit/runner/src/status.js` and
  `test/status.test.js`. Modified `src/run.js` (calls at start, needs-you, usage wall,
  failed, unfinished and finished), `README.md` ("Live status on the card" + module table)
  and `package.json` (0.25.3 → 0.26.0).
- `svelte-todo-kanban` `6376446`: modified `src/lib/server/cardThread.ts` (NOTE prefixes),
  `src/lib/server/__tests__/cardThread.test.ts` (status lines filtered; a person's
  "▶ Running late…" kept) and `package.json` (0.23.0 → 0.23.1).

**Verification**
- Runner `npm test`: 177/177 pass. The new tests cover posting once and then editing,
  taking over an unfinished attempt's comment, a new comment after `■ Finished`, the no-Kanban
  and no-card cases, and Hasura errors becoming log lines.
- Live smoke test on the production Hasura, on this card: posted `▶ Running on smoketest…`,
  edited it to `■ Finished … · $1.23` (same id, one comment), then deleted it.
- Kanban: `npm run check` 0 errors/0 warnings; server vitest 300/300 pass.
- Not seen yet: a real run showing the comment on the board UI. The next runner tick after
  self-update will do that.

**Deviations**
- "Tier step-down on a usage wall" is gone: #75 replaced it with waiting out the wall. That
  event is now the `⏳ Waiting … usage limit, back <time>` edit.
- "Attempt 2" means the next attempt edits the existing comment and shows `attempt 2`. It
  does not get a separate event inside a run.
- The status line also shows tier and attempt on every state, not only on Running.
- `⏸ Needs you` stays until the run ends, because herdr does not report when a human
  answers.
