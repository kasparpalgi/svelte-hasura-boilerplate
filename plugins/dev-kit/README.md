# dev-kit

Shared Claude Code workflow, so `/todo` and friends live in **one place** instead of being
copy-pasted into every repo.

## Install (once per machine)

```bash
claude plugin marketplace add ~/Documents/GitHub/svelte-hasura-boilerplate
claude plugin install dev-kit@klarity
```

Or from GitHub, so other machines get it too:

```bash
claude plugin marketplace add <your-gh-user>/svelte-hasura-boilerplate
claude plugin install dev-kit@klarity
```

Update everywhere: edit the skills here, bump `version` in `.claude-plugin/plugin.json`,
push. Other projects pick it up on `/plugin` update — no per-repo copies to keep in sync.

## Skills

| Skill             | Invoked   | Purpose                                              |
| ----------------- | --------- | ---------------------------------------------------- |
| `/todo <n>`       | by you    | Run a numbered task from `doc/todo/`                 |
| `/plan <request>` | by you    | Write a new numbered task file, don't build          |
| `/verify`         | by you    | Run the project's verification chain                 |
| `research-first`  | by Claude | Look up docs before coding against an unfamiliar API |

## Runner

`runner/` is a small Node service (no dependencies) that watches a Kanban board and runs
`/todo` for you: move a card to **TODO** and it writes the task file and executes it in the
matching repo, then reports back on the card. See [`runner/README.md`](runner/README.md).
It ships here because it is the same cross-project workflow the skills describe — it is not
loaded by Claude Code, you start it yourself.

## Hooks

`PostToolUse` runs `prettier --write` on each `.svelte/.ts/.js/.css` file Claude writes.
Deterministic, costs no tokens, and keeps the "no global `prettier --write .`" rule intact.

## Local development

```bash
claude --plugin-dir ./plugins/dev-kit    # load without installing
/reload-plugins                          # after edits
claude plugin validate ./plugins/dev-kit
```
