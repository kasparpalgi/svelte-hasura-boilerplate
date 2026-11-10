> Run with: Sonnet 5.5 / medium

# Cloud environment that runs this repo's checks

## Original Requirement

[NEVER REMOVE]

Follow-up from #86. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

#86 made **Cloud** a machine on the card. The smoke test card (#93, PR #94) showed what a
cloud VM can run in this repo:

- `npm ci` passes.
- `npm run check` fails with 17 `$env/static/*` errors: there's no `.env` in the clone.
  Type-checking itself works.
- `npm run test:unit:all -- --run`: the server project passes. The client (browser)
  project can't launch, because the VM has `/opt/pw-browsers/chromium` but not Playwright's
  `chromium_headless_shell`.

Make both pass in a cloud session without Hasura. One option is a committed
`SessionStart` hook that runs only in the cloud (`CLAUDE_CODE_REMOTE=true`), copies
`.env.example` to `.env` and runs `npx playwright install chromium-headless-shell`.
Another is the claude.ai cloud environment's setup script. Prefer whichever needs no step
on claude.ai, and document it in `doc/how-it-works.md` → _Cloud session limits_.

Acceptance: a Cloud card on this repo reports `npm run check` and the client unit tests
green in its Results.

Also consider: a cloud session that never pushes leaves its card on "▶ Running on cloud"
for good. A notice after `taskMinutes` with the session link would close that gap
(`klarity-claude-kit` → `runner/src/cloudTick.js`).
