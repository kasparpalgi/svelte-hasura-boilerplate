> Run with: Sonnet 5 / medium

# Fix the runner: path resolution, model parser, restart

## Original Requirement

[NEVER REMOVE]

From 017 diagnosis: the runner daemon is failing on every task because of three bugs:

1. The running process is the OLD Hasura-polling code (pre-task-015). Needs a launchd
   restart.
2. `findPending()` in `run.js` hardcodes `doc/todo/` but `svelte-todo-kanban` uses
   `.claude/todo/`. The server-side writer (task 014) already resolves this — port that
   logic.
3. `explicitTier()` in `classify.js` doesn't recognise "Fable 5" — only "opus", "sonnet",
   "haiku". Add "fable" as a model name.

Additionally, the `/todo` skill in `dev-kit` hardcodes `doc/todo/` — it should resolve the
same way.

## Implementation

All changes in `klarity-claude-kit`:

### 1. `plugins/dev-kit/runner/src/run.js` — resolve task folder

Replace `join(repoPath, "doc", "todo")` with a helper that checks `.claude/todo` first,
falls back to `doc/todo`. Same logic the server uses in task 014.

### 2. `plugins/dev-kit/runner/src/classify.js` — add Fable

Add "fable" to the model map: `{ model: "claude-fable-5-1", effort: "high" }`.

### 3. `plugins/dev-kit/skills/todo/SKILL.md` — resolve task folder

The skill says `Find the file in doc/todo/`. Make it say: find the file in `doc/todo/` or
`.claude/todo/`, whichever exists in this repo.

### 4. Restart the daemon

```bash
launchctl kickstart -k gui/$(id -u)/eu.todzz.kanban-runner
```

Verify the new startup log says `watching N repo(s)` not `watching "TODO" on https://...`.

## Verification

- [x] `findPending` finds files in `.claude/todo/` repos — tested inline, resolved to `.claude/todo/154-theDragAndDrop-TODO.md`
- [x] Fable added to tiers in classify.js, `runWithLabel` in kanban `taskfile.ts`, and classifier prompt
- [x] Runner log shows `watching 2 repo(s) every 20s` after restart
- [x] Claude is actively running task 154 (PID 6590, started after the fix)
- [x] Server-side `taskfile.ts` also fixed to recognise bare "Fable" in card body
- [x] Unit tests: 140/140 pass in kanban repo (including 2 new fable tests)

**Additional fix found during diagnosis:** the launchd plist PATH was missing
`~/.local/bin` — where `claude` lives. That was the actual root cause of every `exit 1`.
Fixed in the plist and documented in the README.

## Results

**Summary** — Fixed three bugs preventing the runner from executing tasks, plus discovered
and fixed the actual root cause (missing PATH entry in launchd plist).

**Files changed**

In `klarity-claude-kit`:
- `plugins/dev-kit/runner/src/run.js` — added `todoDir()` helper, stdin set to `ignore`
- `plugins/dev-kit/runner/src/classify.js` — added "fable" to TIERS, regex, and prompt
- `plugins/dev-kit/skills/todo/SKILL.md` — resolve `.claude/todo` vs `doc/todo`
- `plugins/dev-kit/skills/plan/SKILL.md` — same resolution
- `plugins/dev-kit/.claude-plugin/plugin.json` — version 0.3.1

In `svelte-todo-kanban`:
- `src/lib/server/taskfile.ts` — added "fable" to TIERS, bare model name fallback
- `src/lib/server/__tests__/taskfile.test.ts` — 2 new fable tests

On this machine:
- `~/Library/LaunchAgents/eu.todzz.kanban-runner.plist` — added `~/.local/bin` to PATH

**Deviations**
- The plan said `{ model: "claude-fable-5-1" }` for fable but the actual runner uses
  short model names (`fable`, `opus`, `sonnet`), so used `{ model: "fable" }` instead.
