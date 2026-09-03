---
name: research-first
description: Look up authoritative docs before writing code against an unfamiliar or version-sensitive API. Use before implementing with a library, framework or service whose current API you are not certain of.
---

# Research before you write

Guessing an API costs more than looking it up. Before writing code against a library,
framework or service you are not certain about **right now**, spend one tool call:

| Source                                                  | Use for                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `svelte` MCP — `list-sections` then `get-documentation` | Anything Svelte 5 / SvelteKit                                        |
| Context7 MCP                                            | Version-pinned library API docs (Hasura, Auth.js, Zod, …)            |
| `web_search_exa` / `web_fetch_exa`, else WebSearch      | Release notes, changelogs, "is X still the way"                      |
| The repo itself (grep)                                  | How _this_ codebase already solved it — always cheapest, check first |

Rules:

- **Repo first.** An existing pattern in this codebase beats any doc.
- One targeted lookup, not a survey. Stop when you can write the code.
- Skip entirely for code you can verify by reading local types or running `npm run check`.
- Never invent a config key, flag or import path. If you can't confirm it, say so.
