> Run with: Opus 5.5 / xhigh
> Machine: karel

# move to correct repo

## Original Requirement

[NEVER REMOVE]

see past todo tasks - mostly i work on klarity-claude-kit repo and often things done on svelte-todo-kanban repo also - so make it so i run it on either one same way if needs to be done anything at all in terms of plugins, skills, et used here

_From Kanban card `d1726c4b-b9a9-4ba0-8b4d-e7935e14e5ea`, moved to the agent list._

_GitHub issue #92 — end the commit subject with `(#92)`._

## Results

**Summary** — Both repos are now set up so a Kanban card runs there exactly as it does
here. svelte-todo-kanban had a real bug, now fixed. klarity-claude-kit was ready on the
repo side but has **no todzz board**, so no card can reach it yet. Only you can connect
one (see below).

| Repo | Before | Now |
| ---- | ------ | --- |
| `svelte-todo-kanban` (board *Todzz*) | A legacy project command, `.claude/commands/todo.md` ("do the task, log your actions in the file"), shadowed dev-kit's `/todo`. Kanban task files got `## Plan` / `## Log` sections and were never renamed, so the runner had to finish 32 of them (`docs(todo): finish … (runner)`), against 7 here. No Svelte MCP. | Legacy `todo.md` and the empty `prompt.md` removed, so `/todo` is dev-kit's. `CLAUDE.md` opens with the same *How work happens here* table (task folder `.claude/todo/`), and the old `context.md` is marked as reference only. `.mcp.json` adds the Svelte MCP, pre-approved in `.claude/settings.local.json` the way this repo does it, so no approval dialog stalls a herdr pane. Commit `2538312` |
| `klarity-claude-kit` (no board) | No `CLAUDE.md`, no `.claude/settings.json`, no task folder: every runner/skill task was filed here and worked across in `../klarity-claude-kit` | `.claude/settings.json` byte-identical to what onboarding's `mergeSettings` writes (checked, so onboarding writes nothing). `doc/todo/` with the same `.gitignore` (`*.log`, screenshots). A real `CLAUDE.md`: the workflow table, the layout, version-bump rules (`plugin.json` for skills, `runner/package.json` for the runner), "the runner runs from this checkout, so a push restarts it on every machine: `npm test` first", never touch `runner/config.json`, docs ride with code, how to verify. Commit `37c22ed` |

Not copied: the boilerplate's `svelte-conventions` / `design-system` skills (kanban has its
own conventions in `CLAUDE.md`, and the kit isn't Svelte) and the Svelte MCP for the kit
(it's Node). The dev-kit plugin brings the Exa MCP to both.

**What you need to do (why this is BLOCKED)**

1. On todzz.eu, create a board (for example *Klarity kit*), connect it to GitHub
   `kasparpalgi/klarity-claude-kit` and set its agent list. Within `onboardMinutes`
   each daemon adopts the existing clone and adds it to its own `config.json`. Its only
   commit is a `doc/todo/.gitkeep`. Nothing is copied by hand.
2. File runner / plugin cards there, and Kanban app cards on *Todzz*. todzz cannot move a
   card between boards, so open Backlog items stay here until you re-create them on the
   new board. Where they belong:
   - **klarity-claude-kit**: 003, 005, 041, 042, 046, 049, 056, 076, 087, 088, 089, 090, 091
   - **both** (runner + card UI in svelte-todo-kanban): 030, 086
   - **neither**: 019 (herdr), 020, 035, 043. 022, 028, 067, 074 and 077 have no
     description, so I couldn't place them.

One side effect to expect: once the kit is watched, a dirty tree there (you editing it by
hand) triggers one **⛔ blocked** push for that repo until it's clean, like any other repo.

**Files changed**
- klarity-claude-kit: created `CLAUDE.md`, `.claude/settings.json`, `doc/todo/.gitignore`
- svelte-todo-kanban: deleted `.claude/commands/todo.md`, `.claude/prompt.md`; created
  `.mcp.json`; modified `CLAUDE.md`, `.claude/settings.local.json`
- this repo: this task file, `package.json` 0.19.6 → 0.19.7

**Verification**
- kit `npm test` (runner): 212/212 pass ✔
- `claude plugin validate ./plugins/dev-kit`: passed ✔
- `claude mcp list` in svelte-todo-kanban: `svelte` ✔ Connected and `plugin:dev-kit:exa`
  ✔ Connected, with no approval prompt ✔
- onboarding `mergeSettings` against the kit's new `settings.json`: no change ✔
- No app code changed in either repo, so `npm run check` / e2e weren't run.

**Deviations** — The kanban commit message says "33" runner-finished tasks. The exact
count is 32. It's pushed, so I left it as is.
