> Run with: Opus 5.5 / xhigh
> Machine: dell

# On mac 'server' repo 026 keeps trying although: You've hit your 5-hour limit · resets 12:10am (Europe/Tallinn)

## Original Requirement

[NEVER REMOVE]

it shall not and pay attention on timezones!!!!

_From Kanban card `404a0e87-2739-4e2e-adc7-d0a00b0a2a53`, moved to the agent list._

_GitHub issue #75 — end the commit subject with `(#75)`._

## Results

**Summary** — On Nov 7 the Mac account (Claude Pro) hit the 5-hour wall, and the runner kept
relaunching the task at cheaper tiers. All times below are Tallinn time; the Mac runs on EET.

- **22:25 tekdok 466** started at Opus 5.5 / xhigh. It met the wall at 23:05:37. The runner
  then relaunched it 4 more times within a minute (Opus high → medium → low → Sonnet 5 /
  medium), and each met the same wall. The fifth launch stalled herdr
  (`agent_prompt_stalled`). Its output had no wall text, so **no cooldown was set**, and
  466 went to draft PR #468 "after exit 1". That PR is open, with the commit from 466's first
  40 minutes.
- **23:08 server 026** was claimed next, because nothing was waiting. Sonnet 5 / medium →
  Sonnet / low → Haiku 4.5 / low, 8 s apart, each "Crunched for 0s". Only at Haiku / low,
  with no cheaper tier left, did the runner set the cooldown. That is the "keeps trying" you saw.
- **Root cause:** on a wall the runner stepped down one tier and retried at once ("a cheaper
  tier spends the budget slower"). But the 5-hour and weekly walls cover every model and
  effort, so a session at 100% fails on every tier. The runner does not even detect a
  model-specific limit, so the step-down only ever fired where it could not help.
- **Fix (runner 0.25.2):** the first wall stops the runner. It sets the cooldown and pings
  `Runner ⏳ usage limit` once. No more relaunches.

**Timezones.** This reset was read correctly. 12:10am Europe/Tallinn became 00:10 on Nov 8:
the Mac's `cooldownUntil` 1794089400186 is 2026-11-07T22:10:00Z. All the runner machines are
on Europe/Tallinn: dell, mac, karel and winwsl. The Windows host itself rejected the probe
command (PowerShell), but its WSL runner reports Tallinn. Four time edge cases were wrong,
and are fixed:
1. **A reset minute that was reached or had just passed** was read as the same time tomorrow,
   a 24-hour stall. This happens when the runner wakes at 00:10:00 and the wall lasts a few
   more seconds. Now the day is whichever puts the time nearest now, since a session reset is
   at most 5 h away. The runner waits until one minute past the stated minute, and a reset
   that has already passed is checked again in 15 minutes.
2. **DST:** the old code added wall-clock minutes. Across a clock change (Tallinn, Oct 25:
   04:00 EEST → 03:00 EET) it woke an hour early, into the wall, and then case 1 cost it a
   day. Now the zone's offset is read at the reset moment itself.
3. **A bare `UTC` zone** fell back to a fixed 5-hour wait. Now any zone Intl knows counts. An
   unknown zone still falls back.
4. **Printed times carry their zone.** The log, `--check` and the notification now read
   `08/11/2026, 00:11 EET`, so a runner on UTC cannot look off by the offset.

**Files changed**
- `klarity-claude-kit` `c08ba1c`, under `plugins/dev-kit/runner`:
  - `src/run.js`: step-down loop removed; `stamp` shows the zone.
  - `src/usage.js`: nearest-day reset, DST-safe offset, any known zone, 1-minute slack and
    a 15-minute recheck.
  - `src/classify.js`: the now-unused `downgrade` removed.
  - `test/usage.test.js`: +5 tests. `test/classify.test.js`: `downgrade` tests removed.
  - `README.md` (the Usage limits section) and `package.json` (0.25.2).
- This repo: this task file, plus the Backlog follow-up `doc/todo/076-usageWallFromTranscript.md`.

**Verification**
- Runner `npm test`: 170/170 pass. `test/usage.test.js` also passes with `TZ=UTC`,
  `America/Los_Angeles` and `Asia/Tokyo`, so the result does not depend on the machine's zone.
- The new tests use fixed clocks:
  - 026's exact wording at 23:08:57 Tallinn → 22:11:00Z (00:11 Tallinn).
  - 00:12 with the wall still up → now + 15 min.
  - Across Oct 25 DST → 05:01 EET.
  - Bare `UTC` and `America/New_York` → the exact moment.
  - An unknown zone → the 5 h fallback.
- `node src/run.js --check` on dell runs clean. `prettier --check` is clean on the changed files.

**Deviations**
- The tier step-down is removed entirely, not just narrowed: none of the wall messages the
  runner recognises is model-specific, so there was no case left for it.
- The weekly wall still waits a fixed 7 days. No real weekly message with a time and zone
  exists on these machines to parse against.
- Found while working, filed rather than built: the wall is read from the last 400 lines of
  pane text. A run that only quotes the CLI's wall message would read as a real wall, stop the
  machine and skip its own close-out. That is follow-up `076-usageWallFromTranscript.md`
  (Backlog), which reads the transcript's exact `rate_limit` entry instead.
- This repo's `package.json` is not bumped, because no code changed here. The runner's own
  `package.json` went to 0.25.2.
