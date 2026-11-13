> Run with: Opus 5 / high

# 31 fix

## Original Requirement

[NEVER REMOVE]

31 was completed and made kirjanduse-selts run the first task but as fresh folder calude asked if I trust the folder. From mobile I think I set I trust but it never installed svelte

_From Kanban card `81015da4-64ac-4d81-92f7-d3761a216bc9`._

_GitHub issue #32 — end the commit subject with `(#32)`._

## Results

**Summary** — Nothing left to build: both halves of this report were fixed on
2026-09-22/23, and the trust half is demonstrably working in this very session.

*The trust dialog.* Claude asks "do you trust the files in this folder?" the first time
it starts interactively in a folder it has never seen. The old headless path used `-p`,
which skips the dialog, so it never came up — but a herdr pane is a real TTY, and there
the dialog is a wall: the agent never registers, `agent read` answers `agent_not_found`,
and the task burns an attempt with a two-line log and no transcript. That is exactly what
a fresh clone like `kirjanduse-selts` hit. Fixed in `klarity-claude-kit` by
**`0a7f5f2` fix(runner): trust a repo's folder before opening its Claude pane**
(2026-09-22) — `src/trust.js` sets `projects[<path>].hasTrustDialogAccepted` in
`~/.claude.json`, which is precisely what answering the dialog does, and `src/run.js:174`
calls it just before the pane opens (not at clone time, so a repo added to `config.json`
by hand or cloned by the peer is covered too). `9f311d6` later added `untrustGone()` so
the per-worktree entries are swept with their worktrees instead of piling up (#91), and
`src/cloudTick.js:91` does the same for cloud runs. `src/trust.js`'s own docblock cites
task-032 as the bug it closes.

*"It never installed svelte".* `kirjanduse-selts` has been running ever since. Its
`001-installSveltekit-TODO.md` landed as `-DONE.md`, SvelteKit went in with `711f914 init`
(2026-09-23), and the repo is now at `svelte ^5.56.1` / `@sveltejs/kit ^2.63.0` with 20+
further tasks completed through `021-clientRequests-DONE.md`. Task-031's open deviation
("no install step ran, the stack is still `unknown`, the first `/todo` will handle it") is
therefore also closed.

**Files changed** — this file (renamed `-TODO.md` → `-DONE.md`), `package.json`
0.19.10 → 0.19.11. No code change: the fix already exists in `klarity-claude-kit`.

**Verification**

- Live, not archaeology: `~/.claude.json` on this machine holds
  `TRUSTED /home/ppa/.kanban-runner/worktrees/svelte-hasura-boilerplate/032-31Fix` —
  the runner trusted this worktree before launching the session writing these results,
  and `TRUSTED /home/ppa/Documents/GitHub/customers/kirjanduse-selts` is there too.
- `git log -- src/trust.js` in the kit: `0a7f5f2` (the fix) and `9f311d6` (the sweep);
  `test/trust.test.js` covers it, including the never-overwrite-an-unreadable-config case.
- `kirjanduse-selts`: `doc/todo/001-installSveltekit-DONE.md`, `package.json` has svelte
  and `@sveltejs/kit`, `git log --diff-filter=A` dates the scaffold to `711f914` 2026-09-23.
- No build or test run in this repo — nothing was changed here beyond the task file and
  the version.

**Deviations** — None. The task was a bug report whose fix had already shipped; per the
`/todo` rules that is a `-DONE.md` naming the commit, not a no-op exit.
