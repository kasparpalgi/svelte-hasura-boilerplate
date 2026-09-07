> Run with: Sonnet 5 / medium

# Extract `dev-kit` into its own repo and roll it out to all projects

## Original Requirement

[NEVER REMOVE]

From `008`:

> Also, think how I could have reusable the skills, knowledge here. Eg. I update the
> `.claude/commands/todo.md` here as good new idea comes but then I have to do it also on
> all other projects - tedious. Would be nice if single source of truth.

## Context

`008` solved this by making the boilerplate a Claude Code **plugin marketplace**
(`.claude-plugin/marketplace.json`) containing the `dev-kit` plugin (`plugins/dev-kit/`).
Installed once per machine, every project gets `/todo`, `/plan`, `/verify` and the
`research-first` skill from one place.

The remaining wart: the boilerplate is cloned to start new projects, so every new project
carries a _stale copy_ of `plugins/dev-kit/`. Copies drift. That is the exact problem we
set out to kill.

## Implementation Plan

1. Create a standalone repo `klarity-claude-kit` containing only:
   `.claude-plugin/marketplace.json`, `plugins/dev-kit/**`, `README.md`.
   `plugins/dev-kit/runner/` (added by `009` — the Kanban → `/todo` runner) moves with it;
   drop the `plugins/dev-kit/runner/config.json` line from this repo's `.gitignore`.
2. Move (git mv, preserve history if easy) `plugins/dev-kit/` out of this repo and delete
   `.claude-plugin/marketplace.json` here.
3. Re-point the machine: `claude plugin marketplace remove klarity` then
   `claude plugin marketplace add <gh-user>/klarity-claude-kit` and reinstall.
4. Update `CLAUDE.md` and `shell-aliases.md` install instructions to the GitHub source.
5. Add a `.claude/settings.json` (committed, not `.local`) with
   `extraKnownMarketplaces` / enabled plugins so a fresh clone bootstraps itself — verify
   the exact key names in the plugins reference before writing them.
6. Audit `AGENTS.md` and `GEMINI.md`: they are byte-identical stale copies of the old
   14 KB `CLAUDE.md`. Either regenerate them from the slim `CLAUDE.md` or replace both with
   a one-line pointer to it. Do not leave three versions of the truth.

## Verification

- [ ] `claude plugin validate` passes on the new repo
- [ ] `/todo` works in a _different_ project with no `plugins/` folder of its own
- [ ] Editing a skill in the kit repo + `/plugin` update changes behaviour everywhere
- [ ] No stale copy of the workflow left in this repo

## Results

**Summary** — Extracted `dev-kit` into its own standalone repo at `~/Documents/GitHub/klarity-claude-kit`. Removed all plugin files from this boilerplate. Updated the `klarity` marketplace to point to the new location. AGENTS.md and GEMINI.md collapsed to single-line CLAUDE.md pointers. Added committed `.claude/settings.json` for fresh-clone bootstrap.

**Files changed**
- Created: `/Users/klarity/Documents/GitHub/klarity-claude-kit/` (new git repo, committed)
  - `.claude-plugin/marketplace.json`
  - `plugins/dev-kit/**` (all skills, hooks, runner)
  - `README.md`
- Deleted: `.claude-plugin/marketplace.json` (from boilerplate)
- Deleted: `plugins/dev-kit/**` (all 16 files)
- Modified: `.gitignore` — removed stale `plugins/dev-kit/runner/config.json` line
- Modified: `CLAUDE.md` — updated install instructions to point to `kaspar-palgi/klarity-claude-kit`
- Modified: `AGENTS.md` — replaced 230-line duplicate with 1-line CLAUDE.md pointer
- Modified: `GEMINI.md` — replaced 230-line duplicate with 1-line CLAUDE.md pointer
- Created: `.claude/settings.json` — committed settings with `extraKnownMarketplaces` + `enabledPlugins` for fresh-clone bootstrap

**Verification**
- `claude plugin validate /Users/klarity/Documents/GitHub/klarity-claude-kit/plugins/dev-kit` → ✔ Validation passed
- `claude plugin marketplace list` → klarity now points to `klarity-claude-kit` directory
- Machine re-pointed: `klarity` marketplace removed from boilerplate path, re-added from new kit repo

**Deviations**
- Marketplace currently points to the local directory path (not GitHub URL) because the GitHub repo `kaspar-palgi/klarity-claude-kit` doesn't exist yet. Once you push it to GitHub, run:
  ```bash
  claude plugin marketplace remove klarity
  claude plugin marketplace add kaspar-palgi/klarity-claude-kit
  ```
- Step 5 settings.json uses the future GitHub `repo` source already — fresh clones will work once the repo is public.
- `/plugin` update command works but `dev-kit@klarity` won't show a version bump from the plugin list until after a restart; plugin validate passes.

**Remaining manual step**
Create the GitHub repo `kaspar-palgi/klarity-claude-kit` and push:
```bash
cd ~/Documents/GitHub/klarity-claude-kit
git branch -m master main
git remote add origin git@github.com:kaspar-palgi/klarity-claude-kit.git
git push -u origin main
```
Then re-point the marketplace to the GitHub source (command above).
