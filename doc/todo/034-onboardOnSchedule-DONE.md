> Run with: Sonnet 5 / medium
> Machine: mac

# Onboard connected boards on a schedule

## Original Requirement

[NEVER REMOVE]

Follow-up from `030-creatingNewRunnerProject`. `npm run onboard` now turns a
board→repo connection into a working repo on both machines, but somebody still has to
remember to run it. Connecting the board should be enough.

The runner already re-reads `config.json` every tick and already talks to the same
Hasura endpoint, so the pieces are there. What is missing is a cadence and a guard.

### Work

1. **Cadence.** Run the onboard pass from the daemon — hourly is plenty, not per tick
   (each pass fetches and fast-forwards every clone, which is real git traffic). Keep
   it out of the tick loop's critical path: a slow clone must not delay a task.
2. **The guard that matters.** `scaffold()` does `git fetch` / `pull --ff-only` /
   `pull --rebase` inside a repo. Doing that while the agent is mid-task in that same
   clone is the one way this can hurt. Skip any repo the runner is currently running,
   and skip the whole pass while a task is in flight.
3. **Scope.** The scheduled pass should behave like the default (missing repos only),
   not `--all` — repairing a stale clone is a human's call, not an hourly surprise.
4. **Report.** A new repo appearing is worth one Pushbullet line
   (`Runner ＋ onboarded owner/repo`), the same way a block or a finish is. Silence
   otherwise.
5. **Peers.** The Mac's pass drives Karel over ssh today. Decide whether the scheduled
   one should too, or whether each daemon onboards only itself — the second is simpler
   and each machine polls the same boards anyway.

### Verify

Connect a throwaway board to a repo neither machine has, wait one cycle, and confirm
both machines cloned it, wrote the config entry and pushed nothing twice. Then start a
long task and confirm the pass skips that repo instead of pulling under it.

## Results

**Superseded by `031-newProject-DONE.md`**, which did this work — the two cards are the
same request arriving from both ends: 034 as task-030's own follow-up, 031 as "I
connected a repo and nothing happened". Shipped in `klarity-claude-kit` commit
`49bf477`, runner 0.17.0. Point by point against the five items above:

1. **Cadence** — `onboardMinutes`, default **5**, not hourly. The premise that "each
   pass fetches and fast-forwards every clone" holds only for `--all`; the default pass
   scaffolds *only* boards absent from `config.json`, so an idle sweep is one GraphQL
   query and nothing else. At that price, five minutes buys real responsiveness for
   free. `0` turns it off.
2. **The guard** — satisfied by construction, so no code was needed. `sweepBoards()`
   runs at the top of `tick()`, before the repo loop, in the same single-threaded
   process: a sweep can never overlap a task run. And the repos it touches are by
   definition the ones *not* in `cfg.repos`, which are exactly the repos the runner
   cannot be running. There is no clone for `scaffold()` to pull out from under.
3. **Scope** — default pass, missing repos only. `--all` stays a human's call.
4. **Report** — one Pushbullet per adoption, `Runner ＋ new repo`, naming the repo,
   board and stack. Silence otherwise. A board whose repo will not clone sends
   `Runner ⚠ cannot onboard` **once** per process, not every five minutes.
5. **Peers** — decided as the second option: each daemon onboards only itself. The
   scheduled pass never sshes. `npm run onboard` by hand still drives the peers, for
   when you want it now rather than within five minutes.

**Verification** — done for real rather than with a throwaway board: the Kirjanduse
Selts board was the live case, missing from both machines. `npm test` 83 pass / 0 fail
(3 new); `--check` went from naming `kirjanduse-selts` as waiting to
`boards: 15 connected; all onboarded`; both daemons restarted on 0.17.0.

**Deviations** — the sweep is inline in the tick, not off the critical path as item 1
asked. Moving it to a background task buys a one-time delay of a few minutes on the one
tick that adopts a new repo, and costs a config-write race plus a detached failure path.
Not worth it; revisit if a fresh clone with a slow `npm ci` ever gets in the way.
