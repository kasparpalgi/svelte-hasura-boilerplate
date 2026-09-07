# MEssed up EZY Iot

## Original Requirement

[NEVER REMOVE]

I have messed up the EZY IoT - not synced backlog items into file system. Can you sync?

_From Kanban card `80a4a386-2fb3-4d70-8b77-be00e225518f`._

_GitHub issue #6 — end the commit subject with `(#6)`._

## Results

**Summary** — This card describes a problem in a *different* project (`ezy-rent/ezy-iot`
at `~/Documents/GitHub/ezy/ezy-iot`), not this repo — it was filed against the wrong
Kanban board/repo. Checked the "EZY IoT" board directly via Hasura (only one board is
connected to `ezy-rent/ezy-iot`): all 4 cards currently in its Backlog list
(`023-ld2410doorwaypeoplecount`, `024-ld2410cDoorwayPlacementWalk`,
`025-occupancyStateMachineDrift`, `026-ld2410cIntoFirmwareCombined`) already have matching
task files in `ezy-iot/doc/todo/` with correct `_From Kanban card` markers and content, and
those files are already committed to `main` (e.g. `b65b95c`, `3f38be3`, `1fd6fca`). No
board cards are missing a file. The sync this card asked for already happened — most likely
as a side effect of the 021/LD2410C planning session on 2026-09-06/07, which filed these as
follow-ups automatically. No action was needed in this repo.

**Files changed** — None (verification-only; no changes made in svelte-hasura-boilerplate
or ezy-iot).

**Verification** — Queried the Kanban's Hasura endpoint directly for the `ezy-rent/ezy-iot`
board's Backlog/TODO/Doing/Review/Blocked lists (7 cards total) and cross-checked each
`task_file_path` against the file on disk and its git history. All matched.

**Deviations** — This task was misfiled against this repo's board; work (verification) was
done against `ezy-iot` instead, per user confirmation. No commit/push made here since
nothing changed in this repo.
