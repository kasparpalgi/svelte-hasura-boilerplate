---
name: design-system
description: This project's visual design system — brand tokens, typography, UI components, icons, layout patterns and UX delight (drag, confetti, entrance animations). Use whenever building or changing UI in this repo.
paths:
  - src/**/*.svelte
  - src/**/*.css
---

## Design System

**IMPORTANT**: Every UI you build must follow this design system. Consistency is non-negotiable — same colors, same spacing, same component patterns everywhere.

### Colors

The brand color is **indigo**. Always use `brand-*` tokens, never raw `blue-*`.

| Token       | Value     | Use                             |
| ----------- | --------- | ------------------------------- |
| `brand-50`  | `#eef2ff` | Tinted backgrounds, badge fills |
| `brand-100` | `#e0e7ff` | Icon backgrounds, hover states  |
| `brand-500` | `#6366f1` | Focus rings                     |
| `brand-600` | `#4f46e5` | Primary buttons, links, accents |
| `brand-700` | `#4338ca` | Button hover states             |

Use `gray-*` for text and borders. For status colors, prefer semantic tokens over raw Tailwind:

| Semantic token family            | Use                                 |
| -------------------------------- | ----------------------------------- |
| `error-50/100/200/600/700/800`   | Error backgrounds, borders, text    |
| `success-50/100/200/600/700/800` | Success backgrounds, borders, text  |
| `warning-50/100/200/600/700/800` | Warning backgrounds, borders, text  |
| `info-50/100/200/600/800`        | Info backgrounds (aliases brand-\*) |

Shadows: `shadow-card` · `shadow-popover` · `shadow-elevated` · `shadow-glow` (brand ring + lift)

### Typography

- Display headings: `font-black` or `font-bold`, tight tracking (`tracking-tight`)
- Gradient headline: `class="text-gradient"` (indigo → violet)
- Body: `text-gray-500` for secondary, `text-gray-900` for primary
- Labels/caps: `text-xs font-semibold uppercase tracking-widest text-brand-600`

### Components

Import from `$lib/components/ui/`:

```svelte
import Button from '$lib/components/ui/Button.svelte'; import Badge from
'$lib/components/ui/Badge.svelte'; import Card from '$lib/components/ui/Card.svelte'; import Input
from '$lib/components/ui/Input.svelte'; import Alert from '$lib/components/ui/Alert.svelte';
```

**Button** — `variant`: `primary | secondary | ghost | outline | destructive` · `size`: `sm | md | lg` · `loading` prop for async states

**Badge** — `variant`: `default | success | warning | destructive | outline`

**Card** — `hover` prop adds lift-on-hover animation

**Input** — wraps `<input>` with label, error, and hint. Supports `bind:value`. All native `HTMLInputAttributes` forwarded via rest props.

```svelte
<Input
	id="email"
	label="Email"
	type="email"
	bind:value={email}
	error={errors.email}
	hint="We'll never share it."
/>
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

| Pattern                          | Component                                                                         | When                                        |
| -------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| Form-level error (failed submit) | `<Alert variant="error">`                                                         | Top of the form, conditionally rendered     |
| Field validation error           | `<Input error={msg}>`                                                             | Inline below the input                      |
| Action success confirmation      | `<Alert variant="success">` or `<span class="text-success-700">` with CheckCircle | After save, replaces button row             |
| Page-level status banner         | `<Alert variant="...">`                                                           | Top of page, from URL params or server data |

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
import {(Zap, ShieldCheck, ArrowRight)} from '@lucide/svelte';
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

| Class            | Effect                                  |
| ---------------- | --------------------------------------- |
| `text-gradient`  | Indigo → violet gradient text           |
| `btn-glow`       | Brand glow ring on hover                |
| `section-fade`   | Subtle gray → white gradient background |
| `shadow-card`    | Subtle card shadow                      |
| `shadow-popover` | Elevated shadow for hover/float states  |

---

## UX Delight Guidelines

- **Drag & drop** (`@neodrag/svelte`): add drag-and-drop to lists, cards, and reorderable items wherever it makes the UX more intuitive or fun. Even in places where it's not strictly required, consider it for the "coolness" factor.
- **Confetti** (`@neoconfetti/svelte`): trigger a confetti burst after significant user accomplishments — completing a project, finishing a long task, first signup landing on dashboard. Use the `confetti` Svelte **action** (not a component): `<div use:confetti={{ particleCount: 250, duration: 3500 }} class="fixed left-1/2 top-0 -translate-x-1/2 pointer-events-none z-50">`. Conditionally render with `{#if showConfetti}`. Set a localStorage flag before navigating and check it in `onMount` (never `$effect`) to trigger the burst.
- **Entrance animations** (`tw-animate-css`): already imported. Use `animate-in fade-in slide-in-from-bottom-2 duration-300` on cards/sections as they appear. Use `delay-75`, `delay-150` etc. to stagger sibling elements.
