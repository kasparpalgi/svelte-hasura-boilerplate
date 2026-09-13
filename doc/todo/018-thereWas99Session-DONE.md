> Run with: Opus 4.8 / high

# There was 99% session left but started the session

## Original Requirement

[NEVER REMOVE]

There was todo #004 task requiring function not to start the task when left less than possibly needed to complete. Also #011 tried to fix it. But still started session on 99% session limit usage.

Also, the time is wrong. Logs:

13:54:52 log → /Users/klarity/Documents/GitHub/svelte-todo-kanban/.claude/todo/189-deleteReturnedNoRow.log ---&gt; here shouldn't start as was 99%

13:55:12 ⏳ waiting out usage limit until 2026-09-13T18:54:52.266Z --&gt; here time is actually 16:55:12 Estonian summer time +3h and the time is bullshit as Claude itself says:

You've hit your session limit · resets 5:40pm (Europe/Tallinn)

_From Kanban card `37cfd6df-789f-4c69-97b0-601a21944f16`._

_GitHub issue #18 — end the commit subject with `(#18)`._

---

## Results

**Summary** — Both symptoms trace to the runner in `klarity-claude-kit` (this repo is
the cross-repo task hub). Root cause of the "bullshit time": tasks in `svelte-todo-kanban`
run through a **herdr pane** (interactive), where Claude prints the human wording
`You've hit your session limit · resets 5:40pm (Europe/Tallinn)` — **not** the headless
`| <epoch>` that `usage.js` knew how to read. With no epoch, it fell back to a fixed
`Date.now() + 5h`, which is why the log showed `…T18:54:52.266Z` (exactly 5h after the
run) instead of the real 17:40 Tallinn reset.

Fixes:

1. **Accurate reset time** — `usage.js` now parses `resets <clock> (Region/City)` and
   turns the local time + IANA zone into the exact instant (`nextLocalTime`). Replaying
   the incident (`now` = 16:55 Tallinn, msg = `resets 5:40pm (Europe/Tallinn)`) now yields
   `2026-09-13T14:40:00Z` = 17:40 Tallinn = 5:40pm — matching Claude itself, vs the old
   18:54Z. A bare `(UTC)` (no slash) still falls back, so the epoch path is unchanged.
2. **Local-time logs** — `run.js` log prefix and every reset timestamp now render in the
   machine's own timezone (`18:38:17` EEST), not UTC — that was the "+3h" confusion.
3. **The 99% start** — there is genuinely no pre-flight "% left" API (documented since
   #004), so the *first* run at 99% can't be prevented; the CLI only reveals the wall
   reactively. What's fixed is the fallout: the wall-hit now sets a *correct, short* wait
   (resumes at the real reset, not 5h later), and the attempt it consumed is **given back**
   (`state.addTry(..., -1)`) so a run that started with ~no budget doesn't count toward the
   3-strikes skip.

**Files changed** (all in `~/Documents/GitHub/klarity-claude-kit/plugins/dev-kit/`)

- modified `runner/src/usage.js` — `RESET_AT` regex + `nextLocalTime`; weekly checked
  before same-day reset parsing.
- modified `runner/src/run.js` — `clock`/`stamp` local-time helpers; reset attempt
  rollback on the cooldown branch.
- modified `runner/test/usage.test.js` — 2 new tests (human-wording exact reset;
  bare-UTC fallback).
- modified `runner/README.md` — documented reset-time parsing + attempt rollback.
- bumped `runner/package.json` (0.11.0 → 0.11.1) and
  `.claude-plugin/plugin.json` (0.12.6 → 0.12.7).

**Verification** — `node --test test/*.test.js` → 42 pass / 0 fail (usage suite 8/8).
`node --check` on run.js + usage.js clean. Incident replay confirmed 14:40Z reset.

**Deviations** — Landed in `klarity-claude-kit`, like #004/#011. The 99% *start* itself is
not prevented (no API exists); scope was the accurate-reset + no-unfair-penalty fallout.
No file in this repo changed, so its version was not bumped.
