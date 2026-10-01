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
