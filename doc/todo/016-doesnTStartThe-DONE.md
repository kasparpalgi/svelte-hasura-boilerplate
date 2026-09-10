# Doesn't start the next task

## Original Requirement

[NEVER REMOVE]

At kasparpalgi/ezysmart-web task #019 was moved to TODO list in kanban board while another task on kasparpalgi/ezysmart-landing was working. That one successfully finished and left open as expexted so I can write followup and make it work more but it was good and don't want to work more so what to do so it will pick the kasparpalgi/ezysmart-web task #019? Isee in the repo that the file is renamed to TODO 019-task012Fix-TODO.md but doesn't trigger. Shall I in herdr under workspaces close the workspace? Didn't want to try that. Instead in the open claude code ssession I wrote /exit. Now just terminal seen in that herdr tab. Not sure how to close that. In the runner last line after 20sec was sill: "19:19:18 card → Review, results posted"

Moved again #019 back to Backlog list waited 20sec and the file remained TODO in filesystem 019-task012Fix-TODO.md then moved back to TODO and still nothing happened after 20sec. Also it didn't update the task file what I typed more in it so I manually had to update it.

_From Kanban card `7ad46995-87c7-43d7-bdeb-495f2425f6b4`._

_GitHub issue #16 — end the commit subject with `(#16)`._

## Results

**Summary** — Not a bug. `kanban-runner` (`klarity-claude-kit/plugins/dev-kit/runner`) is
a single daemon that runs **one task, one repo, per tick** (`run.js: if (await
runRepo(...)) return;`), looping through `config.json`'s `repos` map in a fixed order
(`svelte-hasura-boilerplate → svelte-todo-kanban → ezyspace-landing → ezysmart-web →
ezy-iot`). Moving a Kanban card to the agent list only writes/renames the task file via
GitHub's API (`write-task-file/+server.ts`) — it does not nudge the runner. If any repo
earlier in that list has a task running, the daemon is synchronously `await`ing it and
never even reaches `ezysmart-web`'s turn, however many times the card is moved back and
forth. `pollSeconds: 20` is only how often the daemon *checks* — not a bound on how long
a queued repo waits its turn. Confirmed live while investigating this: task #016 in
*this* repo had been running for ~3 hours in the runner's own log, so `ezysmart-web`
(4th in the list) had no chance to run in that window regardless of card moves.

Checked `ezysmart-web` directly: its `.claude/todo/019-task012Fix-TODO.md` is deleted
and a new `019-task012Fix-manual-start.md` (no `-TODO` suffix) sits untracked. That's the
user's own doing, and it's correct: `queue.js listPending()` only recognizes filenames
ending in `-TODO.md` — dropping the suffix is the supported way to keep the runner's
hands off a task while working it by hand. No code change needed there.

Answers to the specific questions:
- **Close the herdr workspace?** No. `/exit` was right — a finished/interrupted run
  leaves its pane open at the shell prompt on purpose (`herdr.js`, task-008) so a human
  can use it; the runner's `reap()` closes any leftover `task-*` tab itself the next
  time that slot is reused. Nothing to clean up by hand.
- **Moving the card Backlog → TODO again?** Achieves nothing beyond the first move —
  `write-task-file` is idempotent and skips a file that's already `-TODO.md`
  ("already a TODO file — nothing to do"). It doesn't make the queue advance faster.
- **Why didn't editing the task file in Kanban update the file?** Editing card content
  should call `update-task-file`, but only while the card still carries a
  `task_file_path` that resolves to an existing file — once the runner (or a human)
  reads past that, edits stop reaching the file and must be applied by hand, as done here.

No runner bug found, so no follow-up task filed. If task starvation behind a long-running
task becomes a recurring pain, that would be a deliberate design change (e.g. reordering
`config.json`'s `repos`, or running more than one task concurrently) — worth a separate
task only if it actually recurs.

**Files changed** — `doc/todo/016-doesnTStartThe-TODO.md` → `-DONE.md` (this file);
`package.json` (patch bump). No runner or app code touched — none was broken.

**Verification** — Investigation only; no code changed in this repo. `npm run check` /
`npm test` not applicable.

**Deviations** — None from the plan; classified as a question to answer rather than a
code fix, per the file's own content.
