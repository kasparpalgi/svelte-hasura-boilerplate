> Run with: Opus 5.5 / high

# Proof of work: screenshots on the card

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# Proof of work: screenshots on the card

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #59. Symphony's agents hand in **proof of work** with each ticket (CI status, review feedback, walkthrough videos); Vibe Kanban and Emdash put a live app preview next to the diff. Our Review column gets text only, so every UI card means pulling and running the app.

- `/verify` (dev-kit) already drives Playwright. For a task that changed UI, save 1–3 screenshots as `<task dir>/NNN-slug-*.png` — gitignored like `NNN-slug.log`, so they never dirty the tree.
- When the runner closes the loop (`kanban.js` `closeLoop`), upload them to the card as attachments. Use the Kanban's existing upload path (R2), not a new store.
- No screenshots → no change.

## Acceptance criteria

- [ ] A UI task's card in Review shows its screenshots as attachments.
- [ ] The PNGs never reach git (gitignore entry written the way `*.log` is).
- [ ] A non-UI task behaves exactly as today.

*GitHub issue #69 — end the commit subject with* `(#69)`*.*

_From Kanban card `0acd1e6a-a1bc-4b45-9bbf-22ebd961d74d`, moved to the agent list._

_GitHub issue #69 — end the commit subject with `(#69)`._

## Results

**Summary** — For a UI task, `/verify` now saves 1–3 screenshots as `<task dir>/NNN-slug-*.png`. When the runner's `closeLoop` moves the card to Review, it posts them to a new Kanban endpoint, `POST /api/runner/upload`. That endpoint stores each file in the same place every card upload goes (the board owner's R2 bucket if they set one, otherwise the app's Backblaze bucket) and inserts an `uploads` row, so the card lists the screenshot as an attachment. A task with no screenshots makes no request and closes exactly as before. Re-runs and reconcile sweeps skip files the card already has. A failed upload is logged and leaves the card's move in place.

One thing differs from the brief: no user has R2 configured today, and every live upload goes to Backblaze B2 (the app's fallback store). So the runner does not sign R2 requests itself. It calls the app, which picks the store with its existing logic (now shared in `storeFile.ts`). The runner authenticates with the Hasura admin secret it already holds, so there are no new secrets to copy to the peer machines.

PR repos: the agent writes screenshots inside the worktree, so `finishPrRun` copies them to the main checkout before the worktree is removed. `closeLoop` and `reconcileCards` find them there when the PR merges.

**Files changed**
- `svelte-todo-kanban` (84dccd8): created `src/lib/server/storeFile.ts`, `src/routes/api/runner/upload/+server.ts` and `src/routes/api/runner/__tests__/upload.test.ts`; modified `src/routes/api/upload/+server.ts` (now uses the shared `storeFile`/`getR2Credentials`) and `package.json` (0.24.0)
- `klarity-claude-kit` (d8fe1b8): created `runner/src/screenshots.js` and `runner/test/screenshots.test.js`; modified `runner/src/kanban.js` (closeLoop attaches), `runner/src/repo.js` (`ignoreLogs` adds each missing rule: `*.log` and `/[0-9]*-*.png`), `runner/src/run.js` (PR worktree carry), `runner/src/config.js` (`appUrl`, default `https://todzz.eu`), `runner/config.example.json`, `runner/README.md`, `skills/verify/SKILL.md` (proof-of-work step), version bumps (plugin 0.21.0, runner 0.26.0)
- this repo: `doc/todo/.gitignore` (+`/[0-9]*-*.png`), `package.json`, this file

**Verification**
- Runner `npm test`: 175/175 pass. New tests cover selecting at most 3 PNGs for the task, the worktree carry, no screenshots → no fetch, skipping files already attached, and the gitignore rule (ignores task PNGs, still tracks `assets/*.png`, no second commit).
- Kanban `npm run check`: 0 errors, 0 warnings. `vitest --project server`: 302/302 pass, including the new endpoint tests (401 without the secret, PNG only, stores for the board owner and inserts the `uploads` row).
- Not run end-to-end against production: it needs Vercel to deploy 84dccd8 and a real UI task to finish. The first UI card that reaches Review will show whether it works. If an upload fails, the runner log shows a `screenshots: …` line.

**Deviations**
- The upload goes through the app's own store choice (R2 if the owner set one, otherwise B2) instead of straight to R2, because no R2 bucket is configured. It is still the existing upload path, not a new store.
- `appUrl` defaults to `https://todzz.eu`, so peer machines need no config change.
