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

- [ ] `findPending` finds files in `.claude/todo/` repos
- [ ] `explicitTier("Fable 5. High.")` returns the fable model
- [ ] Runner log shows the new startup message after restart
- [ ] A test run of `/todo` in `svelte-todo-kanban` finds the file
