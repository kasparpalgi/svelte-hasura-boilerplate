> Run with: Opus 5 / high
> Machine: mac

# creating new Runner project.

## Original Requirement

[NEVER REMOVE]

when a kanban board is connected to GitHub repo then add it to klarity-claude-kit repo's runner's config.json the repo. Also, clone it to GitGub/customers folder if client also exists on a project and into GitHub folder when doesn't have client. Do that on both, on Mac (where I wil run always that session) and in Karel server. Think if anything else needs to be done too? Install also on that project the plugin and whatever else needed depending on that project's stach so once done I can start adding tasks to TODO list immediatelly and they will execute in the best way for that project's stack.

_From Kanban card `57af2f9b-2274-4093-96fc-86459b6c0cd5`._

_GitHub issue #30 — end the commit subject with `(#30)`._

## Results

**Summary** — Connecting a board to a GitHub repo is now one command,
`npm run onboard` in `klarity-claude-kit/plugins/dev-kit/runner`, and it does every
remaining step on **both** machines. It reads the boards themselves (they already hold
the repo and the client), so nothing has to be told twice.

Per repo it: finds the existing clone by its `origin` — wherever it was filed — or
clones a new one (`customers/<repo>` when the board has a client, `<repo>` when it does
not); adds it to the gitignored `config.json`, never rewriting a hand-placed path; merges
`dev-kit@klarity` into the repo's own `.claude/settings.json`; gives it `doc/todo/`
unless it already keeps `.claude/todo/`; writes a `CLAUDE.md` stub naming the detected
stack and the `/plan` → `/todo` → `/verify` table when there is none; installs
dependencies on a fresh clone by lockfile (pnpm / bun / yarn / `npm ci` / `uv sync` /
`go mod download` / `cargo fetch`); and commits and pushes all of it.

That last part is not bookkeeping: an untracked file outside the task folder reads as a
dirty tree to `preflight()`, so onboarding a repo by leaving files in it would block that
repo from ever running. The commit is path-scoped, so a repo mid-edit keeps its own work
out of it. The daemon re-reads `config.json` every tick, so there is nothing to restart.

`peers` in `config.json` then repeats the whole run on Karel over ssh, pulling the kit
there first so both machines run the same code. `--all` re-scaffolds every connected
board's repo and is the repair path; `--dry-run` and `--no-install` do what they say.

**Answering "anything else?"** — five things the first real runs turned up, each fixed:

1. `life-effect-front` and `job` already had clones under `customers/`, three and two
   levels down. The path convention alone would have cloned second copies beside the
   ones being worked in, so `origin` now decides and the convention is only for repos
   that have no clone yet.
2. A pathspec that matches nothing kills the whole `git commit`, so a repo keeping its
   tasks in `.claude/todo` (no `doc/`) never got its setup committed.
3. Gating that commit on what the invocation *wrote* meant a file left behind by a
   failed push was never retried — it just sat there dirty, which is the exact state
   that blocks a repo.
4. An existing clone was used as found. A stale one put the setup commit on an old base
   and the push came back non-fast-forward; it now fetches and fast-forwards first, and
   rebases when the clone has diverged. Pushing is its own step keyed on being ahead of
   upstream, because a rebase leaves the commit local and nothing would retry it.
5. **Karel had no git identity at all** (`user.name` / `user.email` unset). Every commit
   there was failing with `unable to auto-detect email address`. That is not an
   onboarding bug — it would have hit any task the runner finished on Karel. Set to
   `Kaspar L. Palgi <git@e-stonia.co.uk>`, matching the Mac.

**Files changed** — in `klarity-claude-kit` (4 commits, pushed):

- created `plugins/dev-kit/runner/src/onboard.js` — boards → clones, config entries, peer
- created `plugins/dev-kit/runner/src/scaffold.js` — one clone → plugin, task folder, CLAUDE.md, deps
- created `plugins/dev-kit/runner/test/onboard.test.js` — 14 tests
- modified `plugins/dev-kit/runner/README.md` — the six manual steps replaced by the command; `--all` / `--dry-run` / `--no-install` / `--no-peers`; `codeRoot` + `peers`; two rows in *Files*
- modified `plugins/dev-kit/runner/package.json` — `npm run onboard`, 0.15.0 → 0.16.0
- modified `plugins/dev-kit/runner/config.example.json` — `codeRoot`, `peers`
- both machines' gitignored `config.json` — `codeRoot`, 3 new repos; `peers` on the Mac only

Onboarding itself then pushed a `chore: enable the dev-kit agent workflow` commit to the
repos that were missing a `CLAUDE.md`, a task folder or the plugin: `web-horario`,
`life-effect-front`, `job`, `e-stonia`, `profitelgid`, `renlog-mets`, `tekdok-landing`,
`tektok-app`, `kusp`, `ezyspace-landing`, `svelte-todo-kanban`.

**Verification**

- `npm test` in the runner — 80 pass, 0 fail (14 new).
- Live boards, not fixtures: 14 connected, 3 were missing from `config.json`.
- Mac: all 3 onboarded, `web-horario` cloned + `npm ci`, the other two matched to their
  existing clones. Karel: the same 3, all cloned fresh + `npm ci`.
- Idempotent: a second `--all` across all 14 repos on both machines prints nothing.
- `node src/run.js --check` on **both** machines — 14 repos, no dirty tree, no blocked
  repo, no detached HEAD.

**Deviations**

- The `customers/` rule is implemented as asked but is currently inert: **no board has a
  client set**, so every repo resolves to the code root. On the Mac that is hidden by the
  existing clones; on Karel `life-effect-front` and `job` landed at the root while the Mac
  keeps them under `customers/`. Harmless — each machine's config maps the repo to its own
  path — but setting the client on the LifeEffect, TekDok, Renlog and Kusp boards is a
  one-minute fix on the board and makes the two machines agree from then on.
- The `CLAUDE.md` files written into the nine repos that had none are **stubs**: the repo,
  the detected stack, and the workflow table. Each still says
  `[Describe this project in 1-2 sentences.]` and is worth a sentence from you.
- Installing the plugin itself (`claude plugin install dev-kit@klarity`) stays manual —
  it is per machine, not per project, and both machines already have it.
- Filed `034-onboardOnSchedule.md` as a follow-up rather than building it here.
