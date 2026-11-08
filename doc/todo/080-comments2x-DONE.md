> Run with: Opus 5.5 / xhigh
> Machine: dell

# Comments 2x

## Original Requirement

[NEVER REMOVE]

Results and tha other new comment on card are both added two times

_From Kanban card `32e35cd5-3cae-4585-a67e-7157ccb12172`, moved to the agent list._

_GitHub issue #80 — end the commit subject with `(#80)`._

## Results

**Summary** — A finished card now gets its Results once and a single close. There were two causes. Both come from two writers on one card:

- **Results twice (10 cards).** The runner commented the Results on the GitHub issue first, then posted them on the card. The Kanban webhook copies every new issue comment onto the card. When that copy landed after the runner's "already posted?" check (`SAID`), the card got the Results twice, 1–2 s apart. In 9 of the 10 pairs the second copy has a `github_comment_id`, e.g. #73.
  - **Fix, runner (`klarity-claude-kit` `c8dfaf1`):** `closeLoop` posts the Results on the card first, then on the issue. A Kanban error no longer keeps the issue open.
  - **Fix, Kanban (`svelte-todo-kanban` `da57872`):** for a new issue comment, the webhook first looks on the card for a comment with the same text and no GitHub link. If it finds one, it links that comment (sets `github_comment_id`) and does not add a copy. Because the card now always gets the comment before the issue, that check cannot lose the race any more. A person's comment on the board benefits too: it is also written to the card before GitHub.
- **The other comment, "✅ Task complete".** The Kanban's push webhook (task 016) still closed every finished card in this repo. It moved the card, posted "✅ Task complete", and closed the issue. Then the runner closed the same card again, with "■ Finished" and the Results. Because the webhook usually closed the issue first, the runner found it closed and never posted the Results there (#72 and #79 have no issue comment). The webhook also closed the issue of a `-BLOCKED` task, which the runner leaves open on purpose.
  - **Fix (Kanban `da57872`):** the webhook now skips any card that has a runner status line (`▶ Running … on`, …, `■ Finished … on`; Postgres `_regex`, tested on the production Hasura). The runner closes those cards. Users without a runner keep the webhook path unchanged, because their cards never get a status line.
  - `RUNNER_STATUS` now lives in `cardThread.ts`, and that file's `NOTE` filter is built from it, so the prefix list exists once on the Kanban side.
- **Data cleanup:** I deleted the 10 extra Results comments from the production DB. For each pair I deleted the unlinked copy and kept the identical one linked to GitHub; for the one pair with no linked copy (tektok-app, 26 Oct) I kept the first. Nothing referenced the deleted rows. A re-check of 735 Results comments since 1 Sep found 0 duplicates.

**Files changed**
- `svelte-todo-kanban` `da57872`:
  - modified `src/routes/api/github/webhook/+server.ts` (`linkTwin`, and the runner-card skip in `handleTaskFileDone`) and `src/lib/server/cardThread.ts` (exported `RUNNER_STATUS`)
  - created `src/routes/api/github/webhook/__tests__/runnerCard.test.ts`
  - `package.json` 0.25.0 → 0.25.1
- `klarity-claude-kit` `c8dfaf1`:
  - modified `plugins/dev-kit/runner/src/kanban.js` (`closeLoop` / `closeCard`) and `README.md`
  - created `test/closeLoop.test.js`
  - runner `package.json` 0.29.0 → 0.29.1
- This repo: this file; `package.json` 0.19.1 → 0.19.2.

**Verification**
- Kanban `npm run check`: 0 errors, 0 warnings. Vitest (all projects): 387/387 pass, 4 of them new. The new tests send signed webhook calls to `POST` against a mocked Hasura:
  - an issue comment the card already holds is linked, not copied
  - a comment written on GitHub is still copied
  - a push that finishes a runner card leaves the card alone
  - a card no runner touched is still closed as before

  The first and third fail on the old code.
- Kanban eslint: no new errors in the files I changed. The webhook file had 18 errors before (`any`, `no-case-declarations`) and still has the same 18.
- Runner `npm test`: 202/202 pass, 2 of them new: the Results reach the card before `gh issue comment`, and a Kanban that is down still gets the issue closed. Both fail on the old code. They use a fake `gh` shell script, so they are skipped on Windows.
- Not seen end to end yet: the next finished card after the Kanban deploys and the runner self-updates should show one "■ Finished" and one Results, with no "✅ Task complete". Its issue should then carry the Results comment. This card (#80) may still be closed the old way, because the runner process running it started on the old code.

**Deviations**
- I did not remove the push webhook's close step. The runner README calls it the product path for people without a runner (task-016), so it only steps aside for runner cards.
- Not fixed: two runners closing the same card in the same millisecond can still both pass `SAID` (the tektok-app pair on 26 Oct, 12 ms apart). That has happened once and needs a DB unique constraint, so I left it out.
