> Run with: Sonnet 5.5 / low
> Machine: cloud

# Cloud smoke test

## Original Requirement

[NEVER REMOVE]

Test card for #86 (Cloud as a machine). Nothing to build: this card proves that a Cloud card ends as a pull request with a `-DONE.md`.

In Results, report which of this repo's checks run in a cloud VM: `npm ci`, `npm run check` and `npm run test:unit:all -- --run`. For each one that fails, say whether that's down to Hasura, a database or the network being missing. Don't fix anything, and change no file except this task file (no version bump: nothing ships).

_From Kanban card `82d00a35-3432-493c-875a-be1a8158abbc`, moved to the agent list._

_GitHub issue #93 — end the commit subject with `(#93)`._

## Results

**Summary** — Nothing to build. Ran the repo's three checks in the cloud VM to report which work there. No file changed except this one; no version bump.

**Files changed** — modified: this task file (renamed to `-DONE.md`).

**Verification**
- `npm ci` — **runs, passes** (exit 0; only npm audit/version notices).
- `npm run check` — **runs, fails** (exit 1): 17 errors in 7 files, all `Module '$env/static/private|public' has no exported member …` (`API_ENDPOINT`, `HASURA_ADMIN_SECRET`, `AUTH_SECRET`, `PUBLIC_API_ENV`, `PUBLIC_API_ENDPOINT`, `PUBLIC_HAS_GOOGLE_AUTH`, …). Cause: no `.env` in the clone (only `.env.example`; `.env` is not committed). Not Hasura, a database or the network — the env vars that point at them are just unset. Type-checking itself works.
- `npm run test:unit:all -- --run` — **partly runs, exit 1**: server project passes (1 file, 1 test). The client (browser) project fails with `browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1217/...`: the Playwright headless-shell binary isn't installed in the VM (the VM ships `/opt/pw-browsers/chromium` instead). Not Hasura, a database or the network — a missing browser binary.

**Acceptance criteria** — none listed in the file.

**Deviations** — None. Nothing was fixed, as instructed.
