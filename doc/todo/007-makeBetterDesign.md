See ../svelte-hasura-boilerplate colors and buttons and design elements. Tailwind setup. Lucide icons. Add boilerplate into this template beautiful design elements, install lucide, add instructions to Claude and other agents to use this beautiful, same-looking design everywhere.

Add also your own design elements.

Make design better in general! Cooler. Eg. use confetti after first time after signup endin up in the dashboard, etc.

## Changes

- `src/routes/layout.css`: Added `@import 'tw-animate-css'` — enables `animate-in`, `fade-in`, `slide-in-from-*`, `zoom-in` utility classes everywhere
- `src/lib/components/ui/Input.svelte`: NEW — reusable labeled input with error/hint support, `bind:value` via `$bindable`
- `src/lib/components/auth/LoginForm.svelte`: Refactored to use `Button` + `Input` components; sets `localStorage.new_signup = '1'` on successful signup before navigating
- `src/routes/signin/+page.svelte`: Added brand gradient orbs background + card wrapper with `animate-in` entrance animation
- `src/routes/app/+page.svelte`: Confetti burst (`use:confetti`) on first dashboard visit after signup (via `onMount` + localStorage flag); entrance animations on cards; dynamic welcome message
- `src/routes/app/+layout.svelte`: User avatar circle with initials (`$derived.by`); dropdown menu has `animate-in` entrance; `$derived.by` used for computed initials
- `CLAUDE.md`: Documented `Input.svelte`, confetti Svelte action pattern, and `tw-animate-css` usage

## Verification

- [x] `npm run check` passed (0 errors, 0 warnings)
- [x] `svelte-autofixer` run on all modified `.svelte` files — no issues
