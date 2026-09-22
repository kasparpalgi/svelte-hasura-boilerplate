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
