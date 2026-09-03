---
name: verify
description: Run this project's verification chain after a code change. Use when the user types /verify or asks to check that changes are sound.
disable-model-invocation: true
---

# Verify

Run only what the change actually touches. Report real output — never claim green without it.

| Changed            | Run                                                                       |
| ------------------ | ------------------------------------------------------------------------- |
| Any `.svelte` file | `svelte-autofixer` MCP on each file, until it returns nothing             |
| Any TS/Svelte      | `npm run check`                                                           |
| Stores / logic     | `npm run test:unit:all`                                                   |
| Routes / UI        | `npm run test:e2e`, then drive the page in a browser and read the console |
| Anything JS/TS     | `npx fallow audit --base <commit the session started from> --format json` |
| Formatting         | `npx prettier --write <the files you touched>` — never `.`                |

`npx fallow audit`: always pass `--base` pinned to the pre-session commit. Without it the
default base is the merge-base with `origin/main`, so once any of this session's work is
committed the audit compares your changes against themselves and reports a false `pass`.
Fix newly introduced boundary violations, duplicate logic and dead code before finishing.

Before finishing: remove debug `console.log`, use `loggingStore` for production logs and
`displayMessage()` for user-facing feedback.

For anything touching auth, secrets, user input or SQL, also run `/security-review`.
