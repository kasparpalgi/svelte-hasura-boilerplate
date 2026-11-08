> Run with: Opus 5.5 / high

# PR review comments come back as a rework task

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# PR review comments come back as a rework task

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. In pull-request repos (`pullRequests` in the runner config, e.g. tektok-app), the runner files `codeReviewPr<N>` for drafts and `mergeStuckPr<N>` for green PRs that never merged, but a **human's** "Request changes" review or unresolved inline comments on a `todo/*` PR are never picked up. Symphony runs a "PR feedback sweep" (every actionable comment must be fixed or answered with a justified pushback); Sortie and Lisa poll PR reviews and send them back to the agent.

- In `pr.js`'s per-minute PR sweep, a `todo/*` PR whose latest review is `CHANGES_REQUESTED`, or that has unresolved review threads newer than its last push, gets `NNN-reworkPr<N>-TODO.md`. It runs on that PR's branch (as gate-fix tasks do) and lists the comments to address.
- Once per review round, not every minute (the way `mergeStuckPr` is filed once per green run).

## Acceptance criteria

- [ ] A "Request changes" review on a `todo/*` PR produces one rework task within a sweep.
- [ ] The rework session pushes to the same PR branch and replies on each thread.
- [ ] No rework task for bot-only comments or already-resolved threads.

*GitHub issue #71 — end the commit subject with* `(#71)`*.*

_From Kanban card `2614cda7-b569-4188-8385-866fdc5bc7aa`, moved to the agent list._

_GitHub issue #71 — end the commit subject with `(#71)`._

## Results

**Summary** — In pull-request repos the runner now checks every open `todo/*` PR each tick, with one GraphQL call per repo per minute that returns reviews, review threads, the last commit and the PR's files. A PR gets `NNN-reworkPr<N>-TODO.md` when it has either:
- a person's "Request changes" review (from `latestReviews`), or
- an unresolved thread whose last comment from a person is newer than the PR's last commit.

The task lists each point (reviewer, `path:line`, an excerpt, the thread id and a link). It tells the session to:
- `git switch` to the PR's branch, the way review and gate-fix tasks do, and push there
- fix each point or push back with a reason
- reply on every thread with `addPullRequestReviewThreadReply`, starting the reply with `<!-- runner-reply -->`
- answer a review's own text with `gh pr comment`, and ask the reviewer to look again with `gh pr edit --add-reviewer`

**How a round counts:**
- Bot comments (`__typename: Bot` or a `[bot]` login) never count, and neither do resolved threads.
- A thread counts as answered when the marked reply comes after the person's last comment. This matters because the runner's `gh` account is the same as the human's, so login alone cannot tell their comments apart.
- The task is filed once per round. A round is identified by the time of the newest feedback, and that time is written into the task. Nothing is filed while a rework task for the PR is still waiting to run.
- A rework task that already ran on the PR branch still reads `-TODO` on main until the merge. It stops blocking new rounds once the PR's diff carries its `-DONE` rename, or once the runner has handed it to that PR. Without this, a second review before the merge would never be picked up.

**Files changed** — `klarity-claude-kit` `768509d`:
- created `plugins/dev-kit/runner/src/rework.js` and `test/rework.test.js`
- modified `src/pr.js` (exports `fileTask`), `src/run.js` (calls the sweep after `sweepPrs`), `README.md` (PR repos §4 and the module table), `runner/package.json` (0.26.0 → 0.27.0) and `.claude-plugin/plugin.json` (0.21.0 → 0.22.0)
- this repo: this file and `package.json`

**Verification**
- Runner `npm test`: 185/185 pass. The new tests check that:
  - a Request changes review or a thread after the last push is picked up
  - bot reviews and comments, resolved threads, answered (marked) threads, threads older than the last push and APPROVED reviews are ignored, and a bot's reply under a person's comment does not hide that comment
  - a `todo/*` PR gets one task and a `feature/*` PR gets none
  - nothing is re-filed while the task is queued or after it was handed to the PR for the same round
  - a new comment opens a second round that does get filed
- `node src/run.js --check` runs clean.
- Live read-only run against `mytekdok/tektok-app`: the query works and PR #477 has nothing open, so no task. I also checked the reply mutation's input fields against GitHub's schema.
- Not seen end to end yet: the first real "Request changes" on a tektok-app PR will show it working.

**Deviations**
- "Newer than its last push" uses the head commit's `committedDate`, because GitHub's push date is deprecated.
- Threads are left for the reviewer to resolve. The session only replies on them.
- Possible gap: if a session ever posts inline review comments through `gh` (for example `/code-review --comment`), they carry no marker and come from the human's account. They would then count as human feedback until the next push.
