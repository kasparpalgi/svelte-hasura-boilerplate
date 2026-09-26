> Run with: Opus 5.5 / high
> Machine: mac

# Didn't pick task after dirty working tree

## Original Requirement

[NEVER REMOVE]

At kirjanduse-selts repo added task to TODO list but from logs saw "dirty working tree", cleaned up but still doesn't pick the #003 todo task up. Is it because working tree was dirty or some other issue? Looks like file name not ending "-TODO" - again because of dirty working tree didn't rename file to "-TODO" ending?\
\
Or maybe for kirjanduse-selts repo not properly set up to auto run sessions because it was not set up be me but new feature that automatically it is supposed to be set up when I connect to GitHub repo a new board in Kanban board at [todzz.eu](http://todzz.eu) ?

_From Kanban card `e2c8712a-3752-4860-88b0-0b812935be8c`._

_GitHub issue #40 — end the commit subject with `(#40)`._

## Results

**Summary** — Investigation only; no bug and no code change. Neither the dirty tree nor
onboarding caused this: **the card was never put in the TODO list.**

- **Where the card went.** `activity_logs` for card `4785fc90…` ("After install", #3):
  Plan → **Backlog** (18:51:49 UTC) → Plan (18:58:40) → **Backlog** (19:00:03). This board's
  agent list is `TODO` (`settings.agent_list_id = 4cb9951f…`). Backlog sits right next to it
  but isn't the agent list, so `write-task-file` never renamed `003-afterInstall.md` →
  `-TODO.md`. The draft stays suffixless, and by design the runner never auto-runs a
  suffixless file.
- **The dirty tree was a separate issue.** The `-TODO` rename happens on the Kanban server
  through the GitHub API (`svelte-todo-kanban/src/routes/api/github/write-task-file`) and
  never touches the local checkout. The untracked `.env.example` only kept the runner from
  starting a `-TODO` file that already existed. It cleared at 21:54 local, when the runner
  rebased and pushed.
- **Onboarding is fine.** The repo is in `runner/config.json`, the board has an agent list,
  and on 22 Sep #001 was renamed to `-TODO` automatically (`aefab3e`) and picked up by the runner.

**To run #3:** drag "After install" into the **TODO** column. The runner picks it up within about 20 s.

**Side findings (no action taken):**
- The #001 card is still in TODO. Both of its runs on 22 Sep failed in herdr
  (`agent_not_found`, `agent_pane_busy`; the retry fix is in klarity-claude-kit `9e3dbbb`).
  It was finished by hand: the `init` commit `711f914` renamed it to `-DONE`. The runner only
  closes the loop for its own runs, so move the card to Review by hand.
- `kasparpalgi/kirjanduse-selts` has **no GitHub webhook** (`gh api …/hooks` → empty). The
  boilerplate has one. Without it, a manual `-TODO`→`-DONE` rename never moves the card. You
  can register it from the board's webhook settings on `www.todzz.eu`.

**Files changed** — this task file only.

**Verification** — Checked against live data: Hasura `boards`/`todos`/`activity_logs`,
`~/Library/Logs/kanban-runner.log`, kirjanduse-selts `git log`, and `gh api` hooks.
No code was changed, so check/test were not run.

**Deviations** — `package.json` not bumped because no code changed.
