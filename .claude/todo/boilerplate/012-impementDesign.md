# Task: Design System Audit & Fix

## Original Requirement
See the tasks done in 006 from this same folder and see:

1. Why my app still doesn't use the new colors everywhere? Actually after completing this task my app's look and feel didn't get better at all,
2. I see in many places hard-coded SVG in the code. It shall use lucide icons everywhere. See also, if it is included in CLAUDE.md that lucide must be used.
3. All the clickable onclick buttons or links shall have tailwind cursor-pointer and include this instruction in CLAUDE.md (does at the moment Claude every time I start read CLAUDE.md or that shall be included in /todo command?)

## Analysis

- **Colors**: `LoginForm.svelte` had 8 instances of `blue-*` instead of `brand-*`. All other pages already used `brand-*`.
- **SVGs**: Fingerprint icon in `LoginForm.svelte` was a hardcoded SVG → replaced with Lucide `Fingerprint`. Loading spinner in `Button.svelte` → replaced with Lucide `Loader2`. Google OAuth logo kept as-is (brand logo with required specific colors — exception in CLAUDE.md).
- **cursor-pointer**: Missing from 15+ interactive elements across 5 files.
- **CLAUDE.md**: Neither the Lucide rule nor the cursor-pointer rule was documented — both added.

## Changes

- `src/lib/components/auth/LoginForm.svelte`: Import `Fingerprint` from Lucide, replace fingerprint SVG, all `blue-*` → `brand-*`, add `cursor-pointer` to all 5 buttons
- `src/lib/components/ui/Button.svelte`: Import `Loader2` from Lucide, replace spinner SVG
- `src/routes/+page.svelte`: Add `cursor-pointer` to 5 nav/hero links
- `src/routes/app/+layout.svelte`: Add `cursor-pointer` to nav link + 3 menu buttons/links
- `src/routes/app/+page.svelte`: Add `cursor-pointer` to quick link cards
- `src/routes/app/settings/+page.svelte`: Add `cursor-pointer` to email toggle, cancel, delete passkey buttons
- `CLAUDE.md`: Added `cursor-pointer` and Lucide-only rules to Critical Rules section

## Answer to CLAUDE.md question
Claude reads CLAUDE.md automatically at the start of every session (via system context). Adding rules there is the right approach — no need to duplicate them in `/todo`.

## Verification
- [x] svelte-autofixer: no issues on LoginForm.svelte or Button.svelte
- [x] `npm run check` passed (13 pre-existing errors, 0 new)
- [x] All `blue-*` replaced with `brand-*` in LoginForm
- [x] All inline SVGs (except Google brand logo) replaced with Lucide icons
- [x] cursor-pointer added to all interactive elements
- [x] CLAUDE.md updated with both rules

## Results
All design system inconsistencies fixed. The root cause of 006 not improving the look was that it was a workflow/tooling task, not a UI task — it never touched the actual component files. This task fixed the actual component-level issues.