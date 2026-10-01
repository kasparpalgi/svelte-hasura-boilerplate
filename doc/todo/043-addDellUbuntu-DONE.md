> Run with: Opus 5.5 / high

# Add Dell Ubuntu

## Original Requirement

[NEVER REMOVE]

I have in Kanban option "Kaspar Mac" or "Karel Ubuntu" where to run the session. Now add there "Dell Ubuntu" but first see ../server and install in Dell if not installed Claude Code and provide me auth URL to authenticate there account. Also, add to the dropdown and make sure in all machines what's needed restarted so it actually pics up the new "Sonnet 5.5" eg. in Karel still the "Opus 5.5" from Kanban dropdown will trigger "Opus 5".

_From Kanban card `3cf29d8b-be55-43d0-ad56-4dc8a8d5f33d`._

_GitHub issue #43 — end the commit subject with `(#43)`._

## Results

**Summary**
- **Dell (servo, `ssh dell`) is now a third Kanban runner.** Installed Node 22 (npm 12),
  pnpm, yarn, `gh` (logged in as kasparpalgi), Claude Code 2.1.287 (claude.ai login —
  the account you picked, on a Pro plan), herdr 0.9.1 + its Claude hook, and the dev-kit plugin.
  All 17 board repos were onboarded. `herdr-server` + `kanban-runner` run as systemd user
  services. Runner config: `machine: ["dell","dell-ubuntu"]`; the Mac lists `dell` under `peers`.
- **Kanban:** "Dell Ubuntu" added to the machine dropdown and "Sonnet 5.5" to the model
  dropdown. Migration `1806000000000` widens `todos_agent_machine_check` and is applied
  on live Hasura. Auto-deployed to todzz.eu at 22:14 (both strings verified in the live JS).
- **Model pick-up / restarts:** Karel's runner had been running since 24 Sep 17:14 but
  pulled the Opus 5.5 fix at 17:34, so it kept running pre-fix code. That's why
  "Opus 5.5" ran as Opus 5. Karel is pulled and restarted, and now resolves
  `Opus 5.5 → claude-opus-5-5` and `Sonnet 5.5 → claude-sonnet-5-5`. Added Sonnet 5.5 to
  the runner, plus **runner self-update**: every 10 min between tasks it fast-forwards its
  own checkout and exits, so systemd/launchd restarts it on the new code. This stale-code
  problem can't recur. The Mac runner is restarted after this commit.
- **End-to-end verified on Dell:** task 045 (`> Machine: dell`, Haiku) ran in a herdr pane,
  wrote `servo / 2.1.287`, was renamed DONE, committed and pushed by the Dell runner.

**Files changed**
- klarity-claude-kit: `runner/src/classify.js`, `src/selfUpdate.js` (new), `src/run.js`,
  tests, `README.md`, `config.example.json`, versions (runner 0.18.0, plugin 0.14.2)
- svelte-todo-kanban: migration `1806000000000_add_dell_to_agent_machine`, `CardDetailView.svelte`,
  `cardHelpers.ts`, `types/todo.ts`, 3 locales, `taskfile.test.ts`, version 0.18.0
- server: `Dell/kanban-runner/{README.md,*.service}`, `Dell/Dell.md`
- this repo: 044/045 smoke-test tasks, follow-up `046-runnerFalseDone.md`, version 0.13.0

**Verification**
- Runner tests: classify/selfUpdate/machine 17/17 pass. `herdr.test.js` fails 3/3 on `main`
  without these changes too (pre-existing, noted in 046).
- Kanban: `taskfile.test.ts` 56/56. `npm run check` reports 17 errors / 6 warnings, the
  same count on a clean tree (none new).
- Live: migration applied, todzz.eu bundle contains the new options, Karel + Dell runners
  active, Dell `--check` shows mac/karel tasks as "not this machine", e2e 045 green.

**Deviations**
- Smoke test 044 falsely finished as DONE: Claude stopped at the first-run login screen
  because `hasCompletedOnboarding` was missing. Fixed, documented in
  `server/Dell/kanban-runner/README.md`, re-run as 045. Runner bug filed as 046 (Backlog).
- ezy-iot: a CRLF-forced venv file makes fresh clones dirty. Hidden on Dell with
  `assume-unchanged`; the repo still needs a real fix.
- Karel has npm 10.9.8; a fresh `npm ci` of svelte-todo-kanban there would fail (its lockfile needs npm 12).
- Not done: herdr phone relay on Dell (needs a QR scan, like Karel's).
- The Mac runner timed this session out at 45 min (22:35), then "finished" attempt 2 in
  19 s with a placeholder Results block (same false-DONE bug as 044 → task 046). Replaced
  with these results.
