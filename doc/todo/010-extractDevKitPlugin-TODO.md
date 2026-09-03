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
