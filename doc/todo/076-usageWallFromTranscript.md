> Run with: Sonnet 5.5 / medium

# Read the usage wall from the session transcript, not the pane text

## Original Requirement

[NEVER REMOVE]

Follow-up from #75. The runner decides "the usage wall was hit" by regex over the last 400
lines of the herdr pane (`src/usage.js` on `readPane` output). Those lines also hold the
agent's own words. A run that quotes the CLI's wall message, for example a task about the
runner itself or a final summary that cites it, reads as a real wall. The runner then sets
a cooldown and every repo on that machine stops. It also returns before `closeOut`, so the
card is never moved to Review by this run.

The session transcript has an exact signal. A wall is an `assistant` entry with
`"error": "rate_limit"`, `"isApiErrorMessage": true`, `"apiErrorStatus": 429` and model
`<synthetic>`, and its text carries the `resets … (Zone)` wording. `src/sessionUsage.js`
already finds this run's transcript (`findSessionFile`).

- Decide the wall from the transcript's last assistant entry when a transcript exists. Feed
  only that entry's text to `usageLimitHit` for the reset moment.
- Keep the pane-text path only for headless runs or when no transcript is found.

## Acceptance criteria

- [ ] A run whose pane quotes the wall message, but whose transcript ends normally, is not
      treated as a wall.
- [ ] A real wall (synthetic `rate_limit` entry) still sets the cooldown from its reset time.
- [ ] Runner tests cover both.
