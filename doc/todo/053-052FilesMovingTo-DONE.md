# 052 files moving to archive fix

## Original Requirement

[NEVER REMOVE]

TODO 052 moves files to archive if bigger than github issue number BUT only move tasks that are DONE in the file name.

Also, fix the root cause: when agent creates new todo files in file system and at most cases also in Kanban board (bit sometimes also not in Kanban board) then ALSO create Github issue. When kanban board card is created manually from [todzz.eu](http://todzz.eu) web UI then Github issue is created. Maybe somehow same way can be created when agent creates. Ideal: GH issue created first, then get the issue number and when in Kanban board and github issue created then anyway automatically in filesystem is created.

_From Kanban card `9d6361c8-1301-495b-811c-70a3c5f650ad`._

## Results

**Summary**

1. **The archive moves only `-DONE` tasks** (`svelte-todo-kanban` `2264b47`, v0.20.1).
   When issue `#N` needs number `N` in the task folder, the Kanban now archives only files
   that end in `-DONE.md` and are numbered `N` or higher. Each one's `.log` moves with it.
   Drafts, queued `-TODO.md` files and `-BLOCKED.md` files stay where they are. If one of
   those holds `N`, nothing is archived, because archiving would not free the number. The
   file then gets the next free number, as before.

2. **Root cause: every follow-up now gets a GitHub issue first** (`klarity-claude-kit`
   `515cc2a`, runner 0.22.0, dev-kit 0.19.0).
   - *Why some follow-ups never reached the board:* the runner only filed follow-ups at
     the end of its own run, and only files the run committed in that window. Anything
     committed another way was never filed. Example: task 043's pane kept working after
     the runner had already closed the run, and committed `046-runnerFalseDone.md` six
     minutes later, so `046` never got a card. Follow-ups written in a desk session were
     missed the same way. Cards that were made never got a GitHub issue.
   - *Now:* new `src/followup.js` runs in the reconcile sweep every time a repo's HEAD
     moves, whoever made the commit. For each new suffixless `NNN-slug.md` that has no card:
     **GitHub issue** (`gh api`, or the issue already named in the file's
     `_GitHub issue #N_` line) → **file renamed to `N-slug.md`** when `N` is free, with
     the issue line added, then committed and pushed → **Backlog card** with
     `github_issue_number`/`id`/`url` and the new path filled in. It runs only for repos
     with a connected board. If `N` is already taken, the file keeps its name, and the
     Kanban gives it number `N` when the card moves to TODO (that is the 052 logic).
   - *Three runners, no duplicates:* all three runners see the same commits, so the card
     works as a lock. Each runner inserts a card, then re-reads the cards for that path,
     and only the earliest card goes on to open an issue. The others delete their own card
     and stop. A test forces two runners through the pre-check at the same moment and
     asserts that exactly one issue and one card come out.
   - The old card-only filing has been removed from `closeLoop`.

**Files changed**
- `svelte-todo-kanban`: `src/lib/server/taskdir.ts`, `src/lib/server/__tests__/taskdir.test.ts`,
  `src/routes/api/github/__tests__/write-task-file.test.ts`, `package.json`.
- `klarity-claude-kit`: created `runner/src/followup.js` and `runner/test/followup.test.js`;
  modified `runner/src/kanban.js` (old filing removed, `BOARD` exported), `runner/src/run.js`
  (sweep hooked into `reconcile`, the unused `added` diff removed), `runner/README.md`,
  `runner/package.json`, `.claude-plugin/plugin.json`.
- This repo: this file, and `package.json` 0.15.5 → 0.15.6.

**Verification**
- Kanban: `vitest --project=server` 276/276 pass; `npm run check` 0 errors; eslint is
  clean on the changed files. Vercel deploys automatically on push.
- Runner: `npm test` 117/117 pass. The new end-to-end test uses a bare origin, two
  clones, a fake `gh` on PATH and an in-memory Hasura.
- Live, read-only: the `todos` schema has every field and mutation the runner uses, and
  `github_issue_id` is `bigint`. Real issue ids such as 5766165044 need that, and the
  column already holds values that large. `gh api repos/…/issues/53` returns the
  `{id, number, html_url}` shape the runner parses.
- Not checked live: opening a real issue. The first real follow-up will be the live test.
  Look for `↺ follow-up NNN-x.md → issue #N, Backlog` in the runner log.

**Deviations**
- The ideal order in the request was issue first, then card, then file. The runner does
  open the issue before it touches the file or fills in the card's issue fields. But it
  inserts a placeholder card a moment earlier, because the three runners need that card as
  a lock so they don't open duplicate issues.
- Only suffixless follow-ups are filed. A `-TODO.md` written without a card is queued
  work the runner may already be picking up, so renaming it under a run is not safe.
- A follow-up that is pushed while no runner is up is not filed. A freshly started runner
  has nothing to compare against, so its first sweep files nothing. It does not re-scan
  history, because old files across 19 repos would all get issues at once.
- Peers still on runner 0.21 keep the old card-only filing until they self-update
  (within about 10 minutes, between tasks).
