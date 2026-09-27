> Run with: Opus 5.5 / high
> Machine: mac

# Card stays in Todo after a /todo session asks a question

## Original Requirement

[NEVER REMOVE]

The TekDok App card "#059 Data retention, "download my data" and mentor anonymisation"
(`b78b3da6-b9f9-4087-a220-4a2cd1f49fa5`, repo `tektok-app/tektok-app`) is still in **Todo**
even though the task was finished, renamed to `-DONE`, pushed and deployed. Find out why it
was not moved to Review, and fix it so a finished task always reaches Review.

## Evidence (collected 2026-09-27 by the session that did 059)

**1. The runner parked a live, working session as a failure.**

`~/Library/Logs/kanban-runner.log`:

```
13:01:40 ▶ tektok-app/tektok-app 059-retentionAndDataRights-TODO.md (Opus 5.5 / high, attempt 1)
13:32:54   stuck in herdr: Command failed: herdr agent wait task-059 --until idle --until done --until blocked --timeout 351324
{"error":{"code":"timeout","message":"timed out waiting for agent status"},"id":"cli:agent:wait"}
13:32:55 ✘ 059-retentionAndDataRights-TODO.md exit 1 — parked leftover work
```

- About 13:03 the agent asked the owner three questions (`AskUserQuestion`), so herdr reported it
  as `blocked`. The owner answered about 13:27, and the agent kept working as it should.
- Cause, in `klarity-claude-kit/plugins/dev-kit/runner/src/herdr.js` `runInHerdr()` → `clear()`:
  once a block is answered, the wait for the agent to settle
  (`waitFor(name, SETTLED, deadline - Date.now())`) gets only what is left of the
  **`blockedMinutes` (30) budget, counted from the first block**. It does not get the task budget
  (`taskMinutes` 45). 30 min − ~24 min of waiting for the answer = 351 s. The agent needed longer,
  the wait timed out, and `runTask` returned `code 1`.
- `run.js` then treated it as a failed run. `parkDirty()` stashed the agent's live, uncommitted
  work (`runner: parked 059-…-TODO.md at 2026-09-27T10:32:54.786Z`) while the agent was still
  editing. The files reverted under it, and the agent had to `git stash pop` to recover. The early
  `return` also skipped `closeLoop()`, so the runner never moved the card.
- The herdr pane (the agent) was not stopped. It finished the task on its own, but the runner no
  longer followed it.

**2. The manual `-DONE` push did not move the card either.**

- The agent committed `0ab90da` (pushed about 10:42 UTC). It removes
  `doc/todo/059-retentionAndDataRights-TODO.md` and adds `…-DONE.md` in the same commit. That is
  exactly the shape `findTaskFileRenames()` (`svelte-todo-kanban/src/lib/server/taskfile.ts`)
  matches, and `handleTaskFileDone()` in `src/routes/api/github/webhook/+server.ts` should then
  have moved the card to Review.
- Hasura still has the card in `Todo`, `updated_at` 2026-09-27T10:01:04Z, and its last
  `activity_logs` row is the 10:01 `list_moved` into Todo (`5474be2d…`, the board's
  `agent_list_id`). So no webhook delivery reached the handler, or the handler bailed out.
- The TekDok board's `settings` has no webhook record (only `agent_list_id`). Task 040 found the
  same thing on kirjanduse-selts: no GitHub webhook, so a manual `-DONE` never moves the card.
  This could not be confirmed from the 059 session: `gh api repos/tektok-app/tektok-app/hooks`
  needs the `admin:repo_hook` scope.

## Plan (to be refined by the session that runs this)

1. **Runner:** after a block is answered, wait for completion against the **task** budget
   (`taskMinutes`, counted from the prompt or extended by time spent blocked), not what is left of
   `blockedMinutes`. `blockedMinutes` should only limit how long the runner waits for a _human_.
   Add a test in the runner for "blocked → answered → long run" that proves it is not reported
   stuck.
2. **Runner:** a herdr **wait timeout** on an agent that is still `working` is not a failure. Keep
   following it (or re-attach), don't `parkDirty()` the tree under a live agent, and still run the
   rename check + `closeLoop()` once it settles. At minimum, never park while
   `herdr agent read`/status says `working`.
3. **Runner:** on any exit path where the task file already ends `-DONE` in `HEAD` (the agent
   finished by itself), still call `closeLoop()` so the card goes to Review with the Results comment.
4. **Kanban / webhook:** check whether `tektok-app/tektok-app` has the Kanban GitHub webhook
   (`gh auth refresh -s admin:repo_hook`, then list hooks, or the board's webhook settings on
   todzz.eu). Register it if missing, and check the server log for delivery of `0ab90da`. Consider
   having onboarding register the webhook automatically, since it is missing on at least two repos
   (kirjanduse-selts, probably tektok-app).
5. Move card `b78b3da6…` to Review with 059's Results (from
   `tektok-app/doc/todo/059-retentionAndDataRights-DONE.md`) as the comment. Do this by hand or by
   replaying the `-DONE` detection once the webhook exists.

## Related

- `doc/todo/040-didnTPickTask-DONE.md`: "the runner only closes the loop for its own runs";
  missing webhook on kirjanduse-selts.
- `doc/todo/039-whyAfterRebootKarel-DONE.md`.
