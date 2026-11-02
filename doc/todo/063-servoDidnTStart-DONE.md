> Run with: Opus 5.5 / high
> Machine: karel

# Servo didn't start

## Original Requirement

[NEVER REMOVE]

Added to Dell servo kasparpalgi/server repo todo task 013 but it never started

_From Kanban card `65729eb9-ae3c-4612-8a07-7987132d1e0b`, moved to the agent list._

_GitHub issue #63 — end the commit subject with `(#63)`._

## Results

**Summary** — The Dell runner was up the whole time. It skipped `kasparpalgi/server` on
every tick (`skip kasparpalgi/server — dirty working tree — ._.env`) because of one untracked
163-byte file, `._.env`. That's a macOS AppleDouble sidecar, left over from copying the repo off
a Mac on Oct 24. A dirty tree blocks preflight, so no task in that repo could start. Two fixes:

1. **Now:** deleted `~/Documents/GitHub/server/._.env` on Dell. On the next tick the runner
   started `013-chromeRemoteDesktopOn-TODO.md` (13:35), finished it as `-DONE.md`, pushed
   `2a28403` + `5ce5a17`, closed server issue #13 and moved the card to Review.
2. **For good:** in `klarity-claude-kit`, the runner's `dirtyPaths()` now ignores untracked
   `._*` files at any depth, and it lists untracked files one by one (`-uall`), so a folder
   holding only `._*` junk is ignored too. A real file next to them still counts as dirt.
   The same junk had already parked `renlog-metsa`, `tekdok-landing` and `tektok-app` on
   Oct 1. Commit `f156cca`, runner 0.23.4.

**Files changed**
- `klarity-claude-kit`: modified `plugins/dev-kit/runner/src/repo.js`,
  `plugins/dev-kit/runner/test/repo.test.js`, `plugins/dev-kit/runner/package.json` (0.23.4).
- Dell: deleted `~/Documents/GitHub/server/._.env`.
- This repo: this task file (renamed to `-DONE.md`), `package.json` version bump.

**Verification**
- Runner `npm test`: 146/146 pass, including a new test for `._*` sidecars.
- Dell journal: `▶ kasparpalgi/server 013-chromeRemoteDesktopOn-TODO.md` → `✔ … committed
  and pushed` → `card → Review`. The server clone is clean and level with origin.
- No other untracked `._*` files are left in any repo under `~/Documents/GitHub` on Dell.

**Deviations** — None. The other runners pick up 0.23.4 through their normal self-update.
