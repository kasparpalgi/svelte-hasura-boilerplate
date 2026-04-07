# Prime

> Initialize a new session with full project context. Run this at the start of every session.

## Run

```bash
git log --oneline -10
git status
```

## Read

- `CLAUDE.md`
- `.claude/todo/` (scan for active task files)

## Summary

After reading, provide:

1. A brief summary of the project stack (Svelte 5, SvelteKit, Hasura, Auth.js, Tailwind, shadcn-svelte)
2. Key patterns in use: store factory, optimistic updates, GraphQL workflow, i18n routing
3. Available slash commands: `/prime`, `/create-plan`, `/implement`
4. Any active tasks found in `.claude/todo/` and their status
5. Recent commits (last 5) to understand current work in progress
6. Confirmation you're ready to help, noting any immediate context that seems relevant
