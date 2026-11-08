> Run with: Opus 5.5 / high
> Machine: mac

# 'tektok-app' repo doc/todo/465-errorReviewFollowUps-TODO.md didn't start on dell servo

## Original Requirement

[NEVER REMOVE]

Moved to TODO list in Kanban board but didn't start

_From Kanban card `f177dd32-27ad-4184-ae5b-c08c1512cbbf`, moved to the agent list._

_GitHub issue #76 — end the commit subject with `(#76)`._

## Results

**Summary** — 465 did start on Dell. It looked stalled because the runner spent 7½ minutes
installing dependencies before opening any pane, and logged nothing during that time.

| Time (EET) | What happened |
| --- | --- |
| 12:26:36 | Kanban renamed `465-errorReviewFollowUps.md` → `-TODO.md` (`a7c37c1d`) |
| 12:27:20 | Dell runner picked it up 44 s later: `▶ mytekdok/tektok-app 465-… (Opus 5.5 / xhigh, attempt 1)` |
| 12:27–12:34 | `npm ci` in the new worktree `~/.kanban-runner/worktrees/tektok-app/465-…` (tektok-app is a PR repo). No herdr tab, no journal line |
| 12:34:46 | Worktree ready, `herdr agent start task-465` ran, agent working (transcript 120+ lines a minute later) |

Why `npm ci` was slow: 89 tarballs were missing from Dell's npm cache. Several were large
binaries (`@cloudflare/workerd-linux-64` 45 MB, `@fallow-cli/*`, `@rolldown/binding-*`,
`wrangler`, `miniflare`), and 53 fetches took longer than 30 s each, the slowest 438 s.
Dell's network is the root cause. It is on Wi-Fi only (Intel 7260, `CoWork`, 2.4 GHz
channel 2, signal 63, 391k discarded "misc" packets) with no wired NIC. Downloads on Dell
run at ~220–270 KB/s, while the Mac on the same gateway gets 4.5 MB/s. Mac → Dell over the
LAN runs at ~200 KB/s, Dell → Mac at 1.3 MB/s, so Dell's receive path is what is degraded.
The same problem caused the morning's `board sweep failed: fetch failed` and GitHub
`TLS handshake timeout` lines in the journal.

Runner fix (klarity-claude-kit `ff994c3`, runner 0.25.3): `openWorktree` now logs
`npm ci in the new worktree — the agent's pane opens after it` before the install and
`npm ci took Ns` after it. `journalctl --user -u kanban-runner` now shows what the runner
is doing in that window. The README's PR-repo section notes that the pane opens only after
`npm ci`. Runners self-update, so Dell was not restarted mid-task.

**Human action recommended (not blocking):** give Dell a faster link. Options are a USB
Ethernet adapter, a 5 GHz SSID (the 7260 supports it, but none is visible), or moving it
closer to the access point. Until then every new tektok-app worktree on Dell pays minutes
of `npm ci` for any package not yet in its cache.

**Files changed**
- klarity-claude-kit: `plugins/dev-kit/runner/src/worktree.js`, `runner/README.md`, `runner/package.json` (0.25.2 → 0.25.3)
- this repo: this task file (renamed to `-DONE.md`)

**Verification**
- Runner `npm test`: 170/170 pass. `prettier --check src/worktree.js` is clean and the module loads.
- Live check on Dell: 465's agent pane is running with a growing transcript.

**Deviations** — the card asked why 465 didn't start. It had started, so the fix makes the
setup phase visible instead of changing pickup. Also noted, untouched: `doc/todo/076-usageWallFromTranscript.md`
(a suffixless follow-up from #75) shares number 076 with this task.
