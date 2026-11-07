> Run with: Sonnet 5.5 / high

# PR review comments come back as a rework task

## Original Requirement

[NEVER REMOVE]

Follow-up from #59. In pull-request repos (`pullRequests` in the runner config, e.g.
tektok-app), the runner files `codeReviewPr<N>` for drafts and `mergeStuckPr<N>` for green PRs
that never merged, but a **human's** "Request changes" review or unresolved inline comments on a
`todo/*` PR are never picked up. Symphony runs a "PR feedback sweep" (every actionable comment
must be fixed or answered with a justified pushback); Sortie and Lisa poll PR reviews and send
them back to the agent.

- In `pr.js`'s per-minute PR sweep, a `todo/*` PR whose latest review is `CHANGES_REQUESTED`,
  or that has unresolved review threads newer than its last push, gets
  `NNN-reworkPr<N>-TODO.md`. It runs on that PR's branch (as gate-fix tasks do) and lists the
  comments to address.
- Once per review round, not every minute (the way `mergeStuckPr` is filed once per green run).

## Acceptance criteria

- [ ] A "Request changes" review on a `todo/*` PR produces one rework task within a sweep.
- [ ] The rework session pushes to the same PR branch and replies on each thread.
- [ ] No rework task for bot-only comments or already-resolved threads.

_GitHub issue #71 — end the commit subject with `(#71)`._
