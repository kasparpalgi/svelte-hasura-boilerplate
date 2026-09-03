## Project Configuration

### About Project

[Describe your project here in 1–2 sentences. At the moment it is a boilerplate for starting new projects.]

IMPORTANT: develop in the main branch and do not commit your changes (I'll review and decide). For any other tasks do not ask for permissions.

- **Language**: TypeScript
- **Package Manager**: npm
- **Backend**: Hasura GraphQL, PostgreSQL, Auth.js
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, sveltekit-adapter, devtools-json, mcp, shadcn-svelte, auth.js, zod, sveltekit-i18n, mode-watcher, date-fns, @neodrag/svelte, @neoconfetti/svelte, @lucide/svelte

---

## How work happens here

Every request becomes **one markdown file in `doc/todo/`** holding the original prompt at
the top and the outcome at the bottom. That folder is the prompt history — never rewrite
the top of a file.

| Step                                  | Command            |
| ------------------------------------- | ------------------ |
| Turn a request into a task file       | `/plan <request>`  |
| Execute a task file                   | `/todo <number>`   |
| Check a change                        | `/verify`          |
| Audit auth / secrets / input handling | `/security-review` |

These come from the **`dev-kit` plugin**, which is the single source of truth shared by all
projects. It lives in `plugins/dev-kit/` in this repo. Install once per machine:

```bash
claude plugin marketplace add ./            # from this repo's root
claude plugin install dev-kit@klarity
```

Improve the workflow by editing `plugins/dev-kit/skills/*/SKILL.md` and bumping
`plugins/dev-kit/.claude-plugin/plugin.json` — every project picks it up, no copy-paste.

Project-specific knowledge lives in `.claude/skills/` and loads automatically only when
you touch matching files:

- `svelte-conventions` — store pattern, optimistic updates, GraphQL, logging, critical rules
- `design-system` — brand tokens, components, icons, layout, UX delight

Durable preferences and corrections go in the session memory directory, not in this file.

---

## Development Workflow

### 1. Plan

- Use the task file in `doc/todo/`. Leave the original requirement at top.
- Use Sequential Thinking MCP for complex features.

### 2. Implement

- Golden rule: simplicity is GENIUS.
- Keep files ~100 lines, max 200.
- No global formatters (`prettier --write .` is banned — per-file only).

### 3. Verify

- Playwright MCP: test in browser, capture console logs.
- Hasura Console: verify DB changes.

### 4. Test (MANDATORY)

- Unit tests for stores, component tests for UI, E2E with Playwright.
- `npm run check` must pass. `npm test` must pass.

### 5. Clean Up

- Remove debug console logs; use `loggingStore` for production logs.
- Update the task file with results.

---

## MCP Servers

Run `claude mcp list` and confirm these are connected:

| Server                  | Use                                                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **svelte**              | Svelte 5 / SvelteKit docs + `svelte-autofixer`. **Mandatory** for Svelte work: `list-sections` → `get-documentation` → write code → `svelte-autofixer` until clean. Never call `playground-link` for code written to project files. |
| **playwright**          | Browser testing, console logs, UI snapshots                                                                                                                                                                                         |
| **sequential-thinking** | Complex planning, architecture decisions                                                                                                                                                                                            |
| **context7**            | Hasura / Auth.js / library docs (optional)                                                                                                                                                                                          |

---

## Hasura Console

```bash
cd hasura && hasura console   # http://localhost:9695
hasura metadata apply
hasura migrate apply --all-databases
```

GraphQL changes: add the operation to `src/lib/graphql/documents.ts` → `npm run generate`
→ import types from `src/lib/graphql/generated.ts` → verify in Hasura Console.

---

## Directory Structure

```
src/
├── routes/[lang]/
├── lib/
│   ├── components/
│   ├── stores/
│   ├── graphql/
│   │   ├── client.ts
│   │   ├── documents.ts   # ALL queries/mutations
│   │   └── generated.ts   # auto-generated types
│   └── locales/
hasura/
├── metadata/
├── migrations/
└── seeds/
tests/
├── e2e/
└── unit/
doc/todo/                  # prompt + outcome history
plugins/dev-kit/           # shared Claude Code workflow (the marketplace lives at repo root)
.claude/skills/            # project-specific, path-scoped knowledge
```

---

## Scripts Reference

| Script                     | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Runs codegen then starts vite dev server           |
| `npm run generate`         | GraphQL codegen — run after editing `documents.ts` |
| `npm run check`            | Type-check (uses extra Node memory via cross-env)  |
| `npm run test:unit`        | Vitest — client (browser/Svelte components)        |
| `npm run test:unit:server` | Vitest — server (node/API logic)                   |
| `npm run test:unit:all`    | All vitest projects                                |
| `npm run test:unit:ui`     | Vitest with browser UI                             |
| `npm run test:e2e`         | Playwright headless                                |
| `npm run test:e2e:ui`      | Playwright UI mode                                 |
| `npm run test:h`           | Playwright headed, single worker (debug)           |
| `npm run b`                | Production build + tar for Docker/CapRover deploy  |
| `npm run i-npm`            | Update npm to latest version globally              |
| `npm run cu` / `cw`        | Clean reinstall (Unix / Windows)                   |
