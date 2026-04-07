# Task: Update package.json for Boilerplate

## Original Requirement
see my well setup project scripts:
[reference project's package.json — kept at bottom of this file]

what they do and what shall I have on my boilerplate / most projects' starting point? eg. shardcdn for sure but also testing related what else?

write in this file your plan before executing + give your suggestions about great things to have not seen above, too.

Finally need to also update CLAUDE.md and other Claude related files. Add this to todo list, too.

---

## Analysis

### Reference Project Scripts — What They Do

| Script | What it does | Keep in boilerplate? |
|--------|-------------|----------------------|
| `generate` | GraphQL codegen + runs `fix-imports.cjs` post-gen | Yes — already in boilerplate via codegen hooks |
| `dev` | Runs codegen first, then vite dev server | Yes — update to `npm run generate && vite dev` |
| `build` | Standard vite production build | Yes |
| `b` | Build + tar for CapRover/Docker deploy | Yes — useful packaging script | Add to README
| `preview` | Preview production build locally | Yes |
| `prepare` | svelte-kit sync before installs | Yes |
| `check` | Type-check with extra Node memory via `cross-env` | Yes — add cross-env |
| `check:watch` | Same with watch mode | Yes |
| `format` | `prettier --write .` | Yes (keep for user; banned in Claude's workflow per CLAUDE.md) |
| `lint` | prettier check + eslint | Yes |
| `test:unit` | Vitest browser project (client components) | Yes — update current `test:unit` |
| `test:unit:server` | Vitest node project (server/API logic) | Yes — add |
| `test:unit:all` | All vitest projects | Yes — add |
| `test:unit:ui` | Vitest UI for client project | Yes — add |
| `test` | All unit + e2e | Yes — update |
| `test:e2e` | Playwright headless | Yes |
| `test:e2e:ui` | Playwright with UI mode | Yes — add |
| `test:h` | Playwright headed single-worker (debug) | Yes — add |
| `i-npm` | Update npm to version pinned in engines field | Yes — add with engines field | to README, too?
| `cu` / `cw` | Clean reinstall for Unix/Windows | Yes — already in boilerplate |

### Reference Project devDependencies — Boilerplate Decision

| Package | Purpose | Include? |
|---------|---------|---------|
| `cross-env` | Cross-platform env vars (needed for check scripts) | **Yes** |
| `@vitest/ui` | Vitest browser UI | **Yes** |
| `@testing-library/svelte` | Mount & interact with Svelte components in tests | **Yes** |
| `@testing-library/jest-dom` | Extra matchers (`.toBeInTheDocument()` etc.) | **Yes** |
| `jsdom` | DOM environment for server-side tests | **Yes** |
| `shadcn-svelte` | CLI for adding shadcn components | **Yes** |
| `bits-ui` | Headless primitives (shadcn-svelte base) | **Yes** |
| `clsx` | Conditional className builder | **Yes** |
| `tailwind-merge` | Merge Tailwind classes without conflicts | **Yes** |
| `tailwind-variants` | Typed variant system for components | **Yes** |
| `tw-animate-css` | Tailwind-compatible animation classes | **Yes** |
| `@lucide/svelte` | Icon library (new official name) | **Yes** |
| `@graphql-codegen/typed-document-node` | Lower-level codegen plugin | No — `client-preset` covers this |
| `@graphql-codegen/typescript` | Base TS types plugin | No — `client-preset` covers this |
| `@vite-pwa/sveltekit` | PWA support | No — add per project |
| `@internationalized/date` | Date library for calendar components | No — add with calendar component |
| `svelte2tsx` | svelte-check internal dep | No — it's a transitive dep |
| `bcrypt`, `bcryptjs`, `jsonwebtoken` etc. | Project-specific server logic | No |

### Reference Project dependencies — Boilerplate Decision

| Package | Purpose | Include? |
|---------|---------|---------|
| `@auth/sveltekit` | Auth.js for SvelteKit | **Yes** — core stack |
| `@auth/hasura-adapter` | Hasura session adapter for Auth.js | **Yes** — core stack |
| `@sveltejs/adapter-node` | Node.js adapter for Docker/production | **Yes** |
| `mode-watcher` | Dark/light mode management | **Yes** |
| `zod` | Schema validation (forms, API boundaries) | **Yes** |
| `sveltekit-i18n` | i18n (CLAUDE.md references `routes/[lang]/`) | **Yes** |
| `@sveltekit-i18n/parser-default` | i18n parser | **Yes** |
| `date-fns` | Date formatting/manipulation | **Yes** — nearly universal need |
| `lucide-svelte` | Old icon package name (duplicate of `@lucide/svelte`) | No — use `@lucide/svelte` |
| `@neodrag/svelte` | Drag-and-drop | Yes and add to CLAUDE.md that where makes sense use drag'n'drop for coolness sake even sometimes |
| `@neoconfetti/svelte` | Confetti animation | Yes — used in error messages and add to CLAUDE.md that after bigger effort origger success use it |
| `@tiptap/*`, `svelte-tiptap` | Rich text editor | No — add per project |
| `@vercel/analytics`, `@vercel/speed-insights` | Vercel analytics | No — add per project |
| `googleapis`, `nodemailer`, `puppeteer-extra` | Specific integrations | No |
| `pdf-parse` | PDF parsing | No |

### Additional Suggestions (Not in Reference)

- `date-fns` — nearly every project needs date formatting; much lighter than moment. YEs add.
- `@faker-js/faker` (devDep) — generate realistic test data in unit/e2e tests. Add to CLAUDE.md to use it.
- `engines` field — pin Node.js + npm versions for consistent CI/CD environments. Add to README?

---

## Implementation Plan

1. **Update `package.json`**:
   - Add `engines` field (Node ≥20, npm pinned)
   - Update scripts: `dev`, `check`, `check:watch`, `test:unit`, `test`, and add new test/deploy scripts
   - Add devDependencies: `cross-env`, `@vitest/ui`, `@testing-library/svelte`, `@testing-library/jest-dom`, `jsdom`, `shadcn-svelte`, `bits-ui`, `clsx`, `tailwind-merge`, `tailwind-variants`, `tw-animate-css`, `@lucide/svelte`, `@faker-js/faker`
   - Add dependencies: `@auth/sveltekit`, `@auth/hasura-adapter`, `@sveltejs/adapter-node`, `mode-watcher`, `zod`, `sveltekit-i18n`, `@sveltekit-i18n/parser-default`, `date-fns`

2. **Run `npm install`** to install new packages and update lock file.

3. **Update `CLAUDE.md` and `README.md` depending on what suits where better**:
   - Update Add-ons list
   - Add scripts reference section
   - Note test project split (client/server)


---

## Verification
- [x] `npm install` — 613 packages added successfully
- [x] `README.md` updated with all scripts (`b`, `i-npm`, test split, etc.)
- [x] `CLAUDE.md` updated (Add-ons, Scripts Reference, UX Delight Guidelines)
- [ ] `npm run check` — pre-existing failures (missing .env file, unrelated to this task)
- [ ] `npm test` — requires running Hasura backend + .env

---

## Reference Project package.json (original)

```json
{
  "name": "svelte-todo-kanban",
  "scripts": {
    "generate": "graphql-codegen --require dotenv/config && node fix-imports.cjs",
    "dev": "npm run generate && vite dev",
    "b": "vite build && tar -czf deploy.tar.gz ...",
    "check": "cross-env NODE_OPTIONS='--max-old-space-size=4096' svelte-kit sync && ...",
    "test:unit": "vitest --project=client",
    "test:unit:server": "vitest --project=server",
    "test:unit:all": "vitest",
    "test:unit:ui": "vitest --ui --project=client",
    "test": "npm run test:unit:all -- --run && npm run test:e2e",
    "test:e2e:ui": "playwright test --ui",
    "test:h": "playwright test --headed --workers=1",
    "i-npm": "npm install -g npm@$(node -p \"require('./package.json').engines.npm\")"
  }
}
```
