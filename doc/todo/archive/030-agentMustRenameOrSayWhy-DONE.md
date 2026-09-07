> Run with: Opus 5 / high

# An agent that decides "already done" must still finish the file

## Original Requirement

[NEVER REMOVE]

Split out of task-028 (item 4). `157-errors-TODO.md` in `svelte-todo-kanban` did its
work and committed it (66cd03e), then the agent concluded "the task was already
completed, no further action needed" — and stopped without appending `## Results` or
renaming to `-DONE`. The runner is working as designed here: it saw an un-renamed file,
reported `⚠ did not finish`, re-ran it, hit the same ending, and skipped it as a stuck
task. Two wasted runs and a dead queue slot for something that was finished the whole
time. Task-028 closed 157 by hand; this task stops it recurring.

## The actual gap

`skills/todo/SKILL.md` step 6 tells the agent to append Results and rename. It reads as
the tail of a happy path, so an agent that exits early — "nothing to do", "already
done", "blocked" — walks past it. The rename *is* the state, so skipping it is the one
step that cannot be skipped.

## What to build

In `klarity-claude-kit`:

1. **Make step 6 unconditional in `plugins/dev-kit/skills/todo/SKILL.md`.** Every exit
   path ends by writing `## Results` and renaming — `-DONE.md` when the work is complete
   *or was already complete*, `-TODO.md` when a human is needed. "Already done" is a
   `-DONE` with a Results section saying so and naming the commit. Say this where an
   agent bailing early will actually read it, not only at the end.

2. **Consider a cheap net in the runner.** `src/run.js` already detects the exact
   condition (`renamed === false` with a clean tree). A clean tree plus an un-renamed
   file is nearly always "the agent thought it was done" — the ⚠ notification could say
   that outright, or a `--fix-stuck` pass could ask a haiku call to read the file and
   rename it. Judge whether this earns its complexity; the skill fix may be enough on
   its own. If it is, say so and skip it rather than building it.

## Also observed in the same run, unexplained

The user watched the agent's herdr pane vanish mid-work on the phone, then reappear, and
no Telegram notification arrived for it. Worth a look while in `herdr.js`:
`runInHerdr()` closes the task tab in its `finally`, and `reap()` closes any surviving
`task-*` agent at the *start* of the next run — so a second tick overlapping a live run
would kill a working pane. Confirm whether one tick can start before the previous
finishes (`tick()` is awaited in the main loop, so it should not — but the pane
disappearing says otherwise). Check `notify.js` for why the silence.

---

## Results

**Summary**

1. **Step 6 is now unconditional in `plugins/dev-kit/skills/todo/SKILL.md`.** The rule is
   stated in three places an early-exiting agent actually reads, not only at the end:
   - a **"The rename is the state"** paragraph immediately under the intro, before step 1,
     spelling out the consequence (re-run → same ending → stuck, dead queue slot);
   - a third row in the **step 2 classify table** — *Already done, obsolete, or impossible*
     → "Do **not** just stop and explain. Skip to step 6", naming the commit that already
     did it;
   - step 6 retitled **"Log the outcome — every exit path ends here"** with a four-row
     table mapping each ending to a rename: built it / already done before you began /
     nothing left to build / a human must act → `-DONE.md` except the last.

2. **Runner net — built the cheap half, skipped the expensive half.** `--fix-stuck` with a
   haiku call does *not* earn its complexity: it adds an LLM dependency, a new CLI mode and
   a write path to the queue, all to rename one file that a human sees in a notification
   anyway. Skipped deliberately. What it does now is name the diagnosis in the ⚠ message —
   `run.js` already computes `renamed` and `dirtyPaths`, so a clean tree plus an un-renamed
   file (plus the commit hash when HEAD moved) reads as *"probably finished, just not
   renamed; rename it by hand"* instead of an undifferentiated failure. Six lines, no new
   machinery.

3. **The two "unexplained" observations, resolved — both were misreadings, one real bug.**
   - *Vanishing pane:* **not** a `reap()` race. `tick()` is awaited in the main loop and
     launchd (`eu.todzz.kanban-runner`, `KeepAlive`) keeps a single daemon, so two ticks
     cannot overlap. The log shows what the phone actually saw: `161-cardModelDropdown`
     ended attempt 1 at 10:01:46, `runInHerdr`'s `finally` closed the tab, and attempt 2
     opened a fresh one at 10:02:12 — vanish, ~25s gap, reappear. Same shape for 157 at
     10:25:04 → 10:25:29. The only way to reap a live pane is a second runner, i.e. running
     `run.js --once` by hand while the daemon holds a task; documented on `reap()`.
   - *Notification silence:* there is **no Telegram integration** anywhere in the kit —
     `grep -rni telegram` over the repo returns nothing. Notifications are Pushbullet only,
     via `notify.js`. Separately, a real bug: `notify()` was declared `async` and awaited by
     every caller but never returned the `fetch` promise, and swallowed all errors with
     `.catch(() => {})` — so `await notify(...)` returned instantly, a short-lived run could
     exit before the push flushed, and a bad token or a 4xx was invisible forever. It now
     awaits the push with a 10s `AbortSignal.timeout` and logs non-OK responses.

**Files changed** — all in `klarity-claude-kit` except the last two:

- modified `plugins/dev-kit/skills/todo/SKILL.md` — unconditional step 6 (3 read points)
- modified `plugins/dev-kit/runner/src/run.js` — ⚠ message names the "thought it was done" case
- modified `plugins/dev-kit/runner/src/notify.js` — await the push, log failures
- modified `plugins/dev-kit/runner/src/herdr.js` — document `reap()` single-runner invariant
- modified `plugins/dev-kit/.claude-plugin/plugin.json` — 0.7.0 → 0.7.1
- modified `plugins/dev-kit/runner/package.json` — 0.5.0 → 0.5.1
- modified `package.json` (this repo) — 0.7.0 → 0.7.1
- renamed `doc/todo/030-agentMustRenameOrSayWhy-TODO.md` → `-DONE.md`

**Verification**

- `node --check` on all three touched runner files — pass
- `notify()` against the live Pushbullet API with the real token — push delivered, and the
  call **awaited 815 ms** (fire-and-forget would have returned in ~0 ms), confirming the fix
- `notify()` with a deliberately bad token — logs
  `notify failed: 401 {"error":{"code":"invalid_access_token"…}` instead of silence
- `node src/run.js --check` with the modified files — clean, both repos enumerated
- No unit-test suite exists in the runner; no `npm run check` applies (the kit is plain ESM
  scripts, and this repo's own source was untouched apart from the version bump)

**Deviations**

- The `--fix-stuck` / haiku auto-rename pass in item 2 was **not built** — judged as not
  earning its complexity, which the task file explicitly invited ("If it is, say so and skip
  it rather than building it"). The ⚠ wording change covers the same need for a human.
- Item 3 was investigated rather than "fixed" for the pane question, because there was no
  bug there — the daemon is single-instance and the pane cycle is the documented retry. The
  notify bug found alongside it *was* fixed, and it is the likelier cause of any real silence.
