> Run with: Opus 5.5 / high
> Machine: dell

# Mac runner

## Original Requirement

[NEVER REMOVE]

See why Mac didn't pick up 'tektok-app' repo 458 I just moved to TODO. There I think was some issue with Mac runner recently so make sure Mac runner works after reboots etc.

_From Kanban card `438c57fc-4a80-4c85-9bbd-1c65709df3dd`, moved to the agent list._

_GitHub issue #66 — end the commit subject with `(#66)`._

## Results

**Summary** — The Mac runner was up the whole time. Since the Nov 5 12:33 reboot it was started
by launchd and has run tasks since then (`019-immich`, `042-gpsUnlockBurst`, …). Task 458 is
`> Machine: mac`, so only the Mac could take it. But from **Nov 6 15:57** the Mac skipped
`mytekdok/tektok-app` on every tick with `dirty working tree — src-tauri/gen/schemas/desktop-schema.json,
macOS-schema.json`. A dirty repo is never pulled, so the runner never even saw 458.

- **What dirtied it:** rust-analyzer (an editor open on the Mac checkout, `target/flycheck0`)
  ran `cargo check` at 15:53. tektok-app #32 (Nov 5) bumped Tauri to 2.12.5 but regenerated only
  the mobile schemas. Tauri 2.12.5 adds the desktop-only `core:app:exit` and
  `set_fullscreen_on_monitor` permissions, so any desktop build rewrites the two tracked files.
- **Why you didn't hear about it:** the runner sends one `⛔ blocked` ping per block (Nov 6
  15:57), then stays silent. A card moved to TODO 20 hours later got no signal at all.

Fixes:
1. **Now:** restored the two files in the Mac's tektok-app checkout. Its tree is clean, so the
   next tick pulls and starts 458.
2. **tektok-app PR #459:** commits the schemas regenerated for Tauri 2.12.5, so a desktop
   build or a rust-analyzer check stops dirtying the tree. CI merges it when the gate is green.
3. **Runner 0.25.0 (`klarity-claude-kit` `27b210a`):** while a repo is blocked, the runner now
   runs `git fetch` (this never touches the working tree). It sends **`Runner ⛔ task waiting`**
   once for each new `-TODO.md` that origin queued for this machine: "tektok-app
   458-iosMoveOn-TODO.md cannot start on mac: dirty working tree — …". New `src/waiting.js`.

**Reboot resilience (checked, nothing to change):** `eu.todzz.kanban-runner` is a LaunchAgent
with `RunAtLoad` + `KeepAlive`, auto-login is on for `klarity`, FileVault is off, and
`pmset autorestart 1` brings the Mac back after a power cut. The herdr server and relay are
LaunchAgents too, and both are running. The runner also restarted itself cleanly after each
self-update (13:05 and 15:33 on Nov 5). The `cannot reach origin` lines today at 13:39–13:41
were a two-minute network blip that recovered on its own.

**Files changed**
- `klarity-claude-kit/plugins/dev-kit/runner`: created `src/waiting.js` and `test/waiting.test.js`.
  Modified `src/run.js` (`announceWaiting` on the block path), `README.md` (blocked-row text, the
  notification table, the file table), and `package.json` (0.25.0).
- `mytekdok/tektok-app`: PR #459 (`src-tauri/gen/schemas/desktop-schema.json`, `macOS-schema.json`).
- Mac: `git checkout --` of those two files in `~/Documents/GitHub/customers/tektok-app`.
- This repo: this task file.

**Verification**
- Runner `npm test`: 155/155 pass. The 2 new tests check that a blocked clone names origin's new
  tasks for this machine (another machine's task, a finished task and an already-local task are
  all skipped), and that an unreadable origin yields nothing.
- Mac: `git status --porcelain -uall` in tektok-app is empty after the restore. On the next tick the
  journal shows `14:07:01 ▶ mytekdok/tektok-app 458-iosMoveOn-TODO.md (Opus 5.5 / high, attempt 1)`,
  in worktree `todo/458-iosMoveOn`.
- The Mac picks up runner 0.25.0 on its next self-update, once 458's run has finished.

**Deviations** — This repo's `package.json` is not bumped, because no code changed here.
