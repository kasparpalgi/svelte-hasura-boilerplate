> Run with: Opus 5 / high
> Machine: mac

# New project

## Original Requirement

[NEVER REMOVE]

When I add to new project a repo I wanted it to be set up to run like this card I created from kanban board. So update config.json of the plugin on Mac and KArel both and clone the repo on both but not sure if I created the card not under this correct project (can't find it) or not. But created new project in Kanban board and attached a Github repo and seems like nothing happened. At least on mac can't see that repo cloned.

_From Kanban card `d298474a-355d-405b-9b2a-1cf1a8d4c87b`._

_GitHub issue #31 — end the commit subject with `(#31)`._

## Results

**Summary** — Connecting a board to a GitHub repo now really is the whole of it.

Two separate things were behind "nothing happened":

1. **The card was in the right place.** `d298474a` sits on the **Boilerplate** board,
   TODO list — which is why this task file exists and why you are reading these
   results. Nothing was misfiled.
2. **The new project was real, and it was ignored.** The board is
   **Kirjanduse Selts** (created 2026-09-22 18:11 UTC), connected to the private repo
   `kasparpalgi/kirjanduse-selts`, with a client set. It was the only connected board
   missing from the runner's `config.json`, and neither machine had a clone.

The reason is that task-030 ended one step short: it turned six manual steps into one
(`npm run onboard`), but that one still had to be *remembered*. A board connected on
the phone sat inert until someone sat down at the Mac and ran it.

So the daemon now runs it. `src/run.js` sweeps the boards every `onboardMinutes`
(default 5) at the top of the tick, and scaffolds any connected, unarchived board it
has no `repos` entry for — clone, `dev-kit@klarity`, `doc/todo/`, `CLAUDE.md`,
dependencies, setup commit, push. Each adoption pushes a `Runner ＋ new repo` to the
phone, and a repo that will not clone (a board pointing at a repo that does not exist
yet) says so **once**, not every five minutes.

The sweep is this machine only — no ssh from the tick loop. Karel runs the same daemon
against the same boards and adopts them itself, which is both simpler and more robust
than one machine driving the other. `npm run onboard` by hand still drives the peer,
for when you want it now rather than within five minutes.

Mechanically, `onboard.js`'s `main()` became a thin argv wrapper over an exported
`onboard({configPath, dryRun, all, install, peers, log, verbose})` that returns
`{boards, todo, landed, failed}`. `--check` gained a boards line, so
`node src/run.js --check` answers "did my new board get picked up" directly.

**Kirjanduse Selts is now set up on both machines** (run by hand rather than waiting
for the sweep): cloned to `~/Documents/GitHub/customers/kirjanduse-selts` on the Mac
and `/home/krl/Documents/GitHub/customers/kirjanduse-selts` on Karel, both clean, both
on `b9cf459 chore: enable the dev-kit agent workflow`, both in `config.json`. Karel's
clone needed no setup commit of its own: it cloned after the Mac pushed, which is the
idempotence working as designed. Its two existing cards (`001-installSveltekit.md`,
`002-cloudfareEnv.md`) are suffixless Backlog files, so nothing auto-runs there yet —
move them to TODO on the board when you want them.

**Files changed** — all in `klarity-claude-kit` (commit `49bf477`, pushed):

- modified `plugins/dev-kit/runner/src/run.js` — `sweepBoards()` + the `--check` boards line
- modified `plugins/dev-kit/runner/src/onboard.js` — exported `onboard()`, `main()` is now argv-only
- modified `plugins/dev-kit/runner/src/config.js` — `onboardMinutes` (default 5, `0` off)
- modified `plugins/dev-kit/runner/test/onboard.test.js` — 3 new tests
- modified `plugins/dev-kit/runner/README.md` — "Connect a new project" rewritten, `onboardMinutes`, two notification rows
- modified `plugins/dev-kit/runner/config.example.json` — `onboardMinutes`
- modified `plugins/dev-kit/runner/package.json` — 0.16.0 → 0.17.0
- both machines' gitignored `config.json` — `kasparpalgi/kirjanduse-selts`
- created on both machines: the `kirjanduse-selts` clone; its repo got the setup commit

In this repo: this file, and `package.json` 0.12.1 → 0.12.2.

**Verification**

- `npm test` in the runner — **83 pass, 0 fail** (80 before, 3 new).
- `node src/run.js --check` — `boards: 15 connected; all onboarded`, and
  `kasparpalgi/kirjanduse-selts → /Users/klarity/Documents/GitHub/customers/kirjanduse-selts`
  listed on `main` with task dir `doc/todo`.
- Live boards and live clones, not fixtures: before the run, `--check` named
  `kirjanduse-selts` as the one board waiting.
- `git status --porcelain` clean in the new clone on both machines — a dirty tree is
  exactly what would block the repo from ever running.
- The sweep really runs inside the tick, not just via `--check`: a scratch config
  pointed at an unreachable endpoint gives `board sweep failed: fetch failed` on
  `--once` — and the tick carries on past it rather than dying.
- launchd `eu.todzz.kanban-runner` kickstarted and Karel's `kanban-runner.service`
  restarted, both on 0.17.0, both `watching 15 repo(s)`.

**Deviations** — the sweep deliberately does *not* drive peers, unlike the hand-run
command; each machine adopts its own. No install step ran for `kirjanduse-selts`: the
repo has no lockfile or `package.json` yet, so the stack is still `unknown`. It will
need one before a task there can build anything, which the first `/todo` will handle.
