> Run with: Sonnet 5.5 / medium

# Keep repo secrets in sync from the Mac to Karel and Dell

## Original Requirement

[NEVER REMOVE]

From task 043 follow-up: "all .env for all those projects also copied from eg. Mac there?
And when I create new Kanban board and connect to Github repo then also it is cloned to Dell?"

Status on 2026-10-01: cloning of new boards is already automatic on every runner (board
sweep every 5 min). Secrets were **not**: the Mac had 32 gitignored secret files across
the 17 runner repos, Karel 5, Dell 0. A one-off copy was done (Mac → Karel + Dell, never
overwriting). What is left:

1. **Ongoing sync.** A new or changed `.env` on the Mac never reaches the Ubuntu boxes, and
   a newly onboarded repo arrives with no secrets. Add it to the runner's board sweep or a
   `npm run sync-secrets` in `klarity-claude-kit/plugins/dev-kit/runner`. Mac is the source.
   Match files by repo key (paths differ per machine: `job`, `life-effect-front`).
   Files matched: `.env*` (not `.example`/`.sample`), `hasura/config.yaml`, `.secrets/`,
   only when gitignored.
2. **Pitfalls hit in the one-off copy:** macOS `tar` adds `._*` AppleDouble files (use
   `COPYFILE_DISABLE=1`), which made 14 repos dirty on both boxes so the runners skipped
   them. `rsync --files-from=-` plus a `</dev/null` copies nothing, silently. tar keeps
   mtimes, so clean up by `-cmin`, not `-newermt`.
3. **Karel has 5 files that differ from the Mac** and were kept as-is. Decide which copy wins:
   `svelte-todo-kanban/.env`, `customers/tektok-app/.env`, `customers/kusp/.env`,
   `customers/kirjanduse-selts/.env`, `server/.env`.

## Results

**Summary** — The Mac's runner now pushes gitignored secrets to Karel and Dell on every
board sweep (every 5 min). It hashes its own `.env*` (not `.example`/`.sample`),
`hasura/config.yaml` and `.secrets/` (only files git ignores), gets the peer's hashes
in one ssh call per peer, and tars over only the files that are missing or different on
the peer. Repos match by `owner/repo` key, so different paths per machine are fine. Only
a machine with `peers` in its config pushes, which is only the Mac. Files that exist only
on a peer are never touched, so a peer-only override goes in a file the Mac doesn't
have. A repo the peer hasn't cloned yet is skipped, and its secrets follow on the next
sweep. The same thing can be run by hand with `npm run sync-secrets [-- --dry-run]` in
`klarity-claude-kit/plugins/dev-kit/runner`.

Pitfalls from the one-off copy are handled: `COPYFILE_DISABLE=1` plus `--no-xattrs`
means no `._*` files, and both peers' trees were checked clean afterwards. A peer that is
switched off is logged once and again when it's back, not every sweep.

**Decision on Karel's 5 differing files: the Mac wins**, after merging in what only Karel had.
Only key names were compared; no values were printed:
- `svelte-todo-kanban/.env`: the Mac has everything Karel has, plus `GITHUB_WEBHOOK_SECRET` → Mac.
- `customers/kusp/.env`, `server/.env`: the only differences are comments and whitespace → Mac.
- `customers/kirjanduse-selts/.env`: Karel had an extra `ADMIN_PASSWORD` → added to the Mac copy, then Mac.
- `customers/tektok-app/.env`: Karel's copy was stale (written 09-23, before the 09-27 "pin data
  to the EU" change: bucket `tekdok` vs `tekdok-eu`, rotated keys) but had `ANTHROPIC_API_KEY`
  and `ANTHROPIC_WORKSPACE_ID`, which `.env.example` lists and the Mac lacked → added to the Mac copy, then Mac.
- Karel's original 5 files are backed up at `karel:~/.kanban-runner/secrets-backup-2026-10-01/`;
  the Mac's two pre-merge copies are at `~/.kanban-runner/{tektok,kirjanduse}.env.bak`.

**Files changed** (klarity-claude-kit `02add91`)
- created `plugins/dev-kit/runner/src/secrets.js`, `plugins/dev-kit/runner/test/secrets.test.js`
- modified `runner/src/run.js` (`pushSecrets()` runs in `sweepBoards`), `runner/src/config.js`
  (`peers`), `runner/package.json` (`sync-secrets` script, 0.19.0), `runner/README.md`
  ("Secrets on the peers"), `.claude-plugin/plugin.json` (0.15.0)

**Verification**
- `node --test test/secrets.test.js`: 3/3 pass. Full `npm test`: 96/99. The 3 failing tests
  are the herdr pane tests, which fail the same way with this change stashed (10 s timeouts
  against the live herdr server), so they were failing before this task.
- Live: `--dry-run` listed exactly the expected 7 files (Karel's 5 plus the 2 merged ones
  for Dell). The real run sent them, and a second run reported `in sync` for both peers.
  No `._*` files and 0 dirty paths on either peer.
- Daemon end to end: after a `launchctl kickstart -k`, a throwaway gitignored
  `.env.synctest` reached Karel and Dell at the next sweep (log line
  `🔑 karel ← …: .env.synctest`), and both trees stayed clean. The file was then removed on all 3 machines.

**Deviations** — A deleted secret on the Mac is not deleted on the peers. That's on
purpose, so a peer-only file can't be wiped by mistake; delete by hand if ever needed.
