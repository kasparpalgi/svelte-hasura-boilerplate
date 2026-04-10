## Project Configuration

### About Project

[Describe your project here in 1–2 sentences. At the moment it is a boilerplate for starting new projects.]

IMPORTANT: develop in the main branch and do not commit your changes (I'll review and decide). For any other tasks do not ask for permissions.

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, sveltekit-adapter, devtools-json, mcp, shadcn-svelte, auth.js, zod, sveltekit-i18n, mode-watcher, date-fns, @neodrag/svelte, @neoconfetti/svelte, @lucide/svelte

---

## Session Workflow

1. **Plan**: Use `/create-plan [request]` before significant features
2. **Execute**: Use `/implement [plan-path]` to execute plans
3. **Verify (if asked)**: Playwright MCP + `npm run check` + `npm test`

## Commands

| Command | Purpose |
|---------|---------|
| `/create-plan [request]` | Research codebase and produce a plan in `.claude/todo/` |
| `/implement [plan-path]` | Execute a plan step-by-step with verification |

See `shell-aliases.md` for `cs`/`cr` launch aliases that auto-run `/prime`.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## MCP Servers (Setup if not done yet)

Run: `claude mcp list` list to see if all below MCP servers are (✓ Connected):
# - playwright
# - sequential-thinking
# - filesystem (optional)
# - context7 (optional)

- **Playwright**: Browser testing, console logs, UI snapshots
- **Sequential Thinking**: Complex planning, architecture decisions
- **Context7**: Hasura etc. documentation

## Backend Stack

Hasura GraphQL, PostgreSQL, Auth.js

## Development Workflow

### 1. Plan
- Use the task file in `todo/`. Leave the original requirement at top.
- Use Sequential Thinking MCP for complex features.

### 2. Implement
- Follow store factory pattern (see below).
- Golden rule: simplicity is GENIUS.
- Keep files ~100 lines, max 200.
- No global formatters (`prettier --write .` is banned).

### 3. Verify
- Playwright MCP: test in browser, capture console logs.
- Hasura Console: verify DB changes.

### 4. Test (MANDATORY)
- Unit tests for stores, component tests for UI, E2E with Playwright.
- `npm run check` must pass. `npm test` must pass.

### 5. Clean Up
- Remove debug console logs.
- Use `loggingStore` for production logs.
- Update task file with results.

---

## Hasura Console

```bash
cd hasura && hasura console   # http://localhost:9695
hasura metadata apply
hasura migrate apply --all-databases
```

---

## Store Pattern (CRITICAL)

```typescript
import { browser } from '$app/environment';

function createStore() {
  const state = $state({ items: [], loading: false, error: null });

  async function loadItems() {
    if (!browser) return;
    state.loading = true;
    state.error = null;
    try {
      const data = await request(GET_ITEMS, {});
      state.items = data.items || [];
    } catch (error) {
      state.error = error.message;
    } finally {
      state.loading = false;
    }
  }

  const sorted = $derived([...state.items].sort((a, b) => a.order - b.order));

  return {
    get items() { return state.items; },
    get loading() { return state.loading; },
    get error() { return state.error; },
    get sorted() { return sorted; },
    loadItems,
  };
}

export const store = createStore();
```

Rules: single `$state` object · browser guard · loading reset in `finally` · getters prevent external mutation · return `{ success, message, data? }`.

---

## Optimistic Updates

```typescript
async function updateItem(id, updates) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx === -1) return { success: false, message: 'Not found' };
  const original = { ...state.items[idx] };
  state.items[idx] = { ...original, ...updates }; // optimistic
  try {
    const data = await request(UPDATE_ITEM, { id, updates });
    const updated = data.update_items?.returning?.[0];
    if (!updated) throw new Error('Update failed');
    state.items[idx] = updated;
    return { success: true, message: 'Updated', data: updated };
  } catch (error) {
    state.items[idx] = original; // rollback
    return { success: false, message: error.message };
  }
}
```

---

## GraphQL Workflow

1. Add operation to `src/lib/graphql/documents.ts`
2. `npm run generate`
3. Import types from `src/lib/graphql/generated.ts`
4. Use `request()` from `src/lib/graphql/client.ts`
5. Verify in Hasura Console

---

## Logging

```typescript
import { loggingStore } from '$lib/stores/logging.svelte';
loggingStore.error('Component', 'msg', { error });  // persisted to DB
loggingStore.debug('Component', 'msg', { data });   // dev only
```

---

## User Feedback

```typescript
import { displayMessage } from '$lib/stores/errorSuccess.svelte';
displayMessage('Error occurred');          // error, 7 s
displayMessage('Saved!', 1500, true);      // success, 1.5 s
```

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
todo/
```

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Runs codegen then starts vite dev server |
| `npm run generate` | GraphQL codegen — run after editing `documents.ts` |
| `npm run check` | Type-check (uses extra Node memory via cross-env) |
| `npm run test:unit` | Vitest — client (browser/Svelte components) |
| `npm run test:unit:server` | Vitest — server (node/API logic) |
| `npm run test:unit:all` | All vitest projects |
| `npm run test:unit:ui` | Vitest with browser UI |
| `npm run test:e2e` | Playwright headless |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:h` | Playwright headed, single worker (debug) |
| `npm run b` | Production build + tar for Docker/CapRover deploy |
| `npm run i-npm` | Update npm to latest version globally |
| `npm run cu` / `cw` | Clean reinstall (Unix / Windows) |

---

## Design System

**IMPORTANT**: Every UI you build must follow this design system. Consistency is non-negotiable — same colors, same spacing, same component patterns everywhere.

### Colors

The brand color is **indigo**. Always use `brand-*` tokens, never raw `blue-*`.

| Token | Value | Use |
|-------|-------|-----|
| `brand-50` | `#eef2ff` | Tinted backgrounds, badge fills |
| `brand-100` | `#e0e7ff` | Icon backgrounds, hover states |
| `brand-500` | `#6366f1` | Focus rings |
| `brand-600` | `#4f46e5` | Primary buttons, links, accents |
| `brand-700` | `#4338ca` | Button hover states |

Use `gray-*` for text and borders. For status colors, prefer semantic tokens over raw Tailwind:

| Semantic token family | Use |
|---|---|
| `error-50/100/200/600/700/800` | Error backgrounds, borders, text |
| `success-50/100/200/600/700/800` | Success backgrounds, borders, text |
| `warning-50/100/200/600/700/800` | Warning backgrounds, borders, text |
| `info-50/100/200/600/800` | Info backgrounds (aliases brand-*) |

Shadows: `shadow-card` · `shadow-popover` · `shadow-elevated` · `shadow-glow` (brand ring + lift)

### Typography

- Display headings: `font-black` or `font-bold`, tight tracking (`tracking-tight`)
- Gradient headline: `class="text-gradient"` (indigo → violet)
- Body: `text-gray-500` for secondary, `text-gray-900` for primary
- Labels/caps: `text-xs font-semibold uppercase tracking-widest text-brand-600`

### Components

Import from `$lib/components/ui/`:

```svelte
import Button from '$lib/components/ui/Button.svelte';
import Badge from '$lib/components/ui/Badge.svelte';
import Card from '$lib/components/ui/Card.svelte';
import Input from '$lib/components/ui/Input.svelte';
import Alert from '$lib/components/ui/Alert.svelte';
```

**Button** — `variant`: `primary | secondary | ghost | outline | destructive` · `size`: `sm | md | lg` · `loading` prop for async states

**Badge** — `variant`: `default | success | warning | destructive | outline`

**Card** — `hover` prop adds lift-on-hover animation

**Input** — wraps `<input>` with label, error, and hint. Supports `bind:value`. All native `HTMLInputAttributes` forwarded via rest props.
```svelte
<Input id="email" label="Email" type="email" bind:value={email} error={errors.email} hint="We'll never share it." />
```

**Alert** — banner for error/success/warning/info messages. Animated in with icon. Optional `title` prop for a bold heading.
```svelte
<!-- Error from form action -->
<Alert variant="error">{form.error}</Alert>

<!-- Success confirmation -->
<Alert variant="success" title="Saved">Your changes have been applied.</Alert>

<!-- Warning -->
<Alert variant="warning">Your session expires in 5 minutes.</Alert>

<!-- Info -->
<Alert variant="info">Feature in beta — feedback welcome.</Alert>
```

### Error & success patterns

| Pattern | Component | When |
|---|---|---|
| Form-level error (failed submit) | `<Alert variant="error">` | Top of the form, conditionally rendered |
| Field validation error | `<Input error={msg}>` | Inline below the input |
| Action success confirmation | `<Alert variant="success">` or `<span class="text-success-700">` with CheckCircle | After save, replaces button row |
| Page-level status banner | `<Alert variant="...">` | Top of page, from URL params or server data |

Inline success (small, next to a Save button):
```svelte
{#if saved}
  <span class="flex items-center gap-1 text-xs text-success-700">
    <CheckCircle class="h-3.5 w-3.5" /> Saved
  </span>
{/if}
```

### Icons

Always use **Lucide** (`@lucide/svelte`). Never use inline SVGs or emoji for UI icons.

```svelte
import { Zap, ShieldCheck, ArrowRight } from '@lucide/svelte';
<Zap class="h-4 w-4" />
```

Icon sizes: `h-3.5 w-3.5` (tiny), `h-4 w-4` (default), `h-5 w-5` (large).

### Layout patterns

- Max content width: `max-w-5xl mx-auto px-4` or `px-6`
- Card: `rounded-xl border border-gray-200 bg-white shadow-card`
- Card hover: add `transition-all duration-200 hover:-translate-y-1 hover:shadow-popover`
- Section heading: small caps label above + larger bold title below
- Hero gradient orbs: `absolute h-[600px] w-[600px] rounded-full bg-brand-100/60 blur-3xl`
- Sticky nav: `sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100`

### Custom CSS utilities (defined in `layout.css`)

| Class | Effect |
|-------|--------|
| `text-gradient` | Indigo → violet gradient text |
| `btn-glow` | Brand glow ring on hover |
| `section-fade` | Subtle gray → white gradient background |
| `shadow-card` | Subtle card shadow |
| `shadow-popover` | Elevated shadow for hover/float states |

---

## UX Delight Guidelines

- **Drag & drop** (`@neodrag/svelte`): add drag-and-drop to lists, cards, and reorderable items wherever it makes the UX more intuitive or fun. Even in places where it's not strictly required, consider it for the "coolness" factor.
- **Confetti** (`@neoconfetti/svelte`): trigger a confetti burst after significant user accomplishments — completing a project, finishing a long task, first signup landing on dashboard. Use the `confetti` Svelte **action** (not a component): `<div use:confetti={{ particleCount: 250, duration: 3500 }} class="fixed left-1/2 top-0 -translate-x-1/2 pointer-events-none z-50">`. Conditionally render with `{#if showConfetti}`. Set a localStorage flag before navigating and check it in `onMount` (never `$effect`) to trigger the burst.
- **Entrance animations** (`tw-animate-css`): already imported. Use `animate-in fade-in slide-in-from-bottom-2 duration-300` on cards/sections as they appear. Use `delay-75`, `delay-150` etc. to stagger sibling elements.

---

## Critical Rules

- `if (!browser) return;` — always check before DOM/localStorage access.
- Never store sensitive data in localStorage.
- All GraphQL in `documents.ts`; run `npm run generate` after changes.
- Factory pattern for all stores; single `$state` object; expose via getters.
- All clickable elements (`<button>`, `<a>`, `onclick`, `role="button"`) **must** include `cursor-pointer` Tailwind class.
- Always use **Lucide** icons (`@lucide/svelte`) — never inline SVGs (exception: third-party brand logos like Google OAuth that require specific brand colors).

---

## Task Template

```markdown
# Task Name

## Original Requirement
[NEVER REMOVE]

## Analysis
- Affected files:
- MCP needed:

## Implementation Plan
1.

## Changes
- `file.ts`:

## Verification
- [ ] Browser tested (Playwright MCP)
- [ ] DB verified (Hasura Console)
- [ ] Tests passing
- [ ] `npm run check` passed
- [ ] `npm test` passed
```