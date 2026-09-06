At src/routes main page there's landing page of telling what this does.

Create a subpage about the cool agentic development flow we just created and shorlt mention it on the main page then lin there, too.

Also, see if voice input and browser extension to save stuff from web here and the notes taking is mentioned. MAke the website up to date. It might be multi-todo session task so then create followup todo files.
---

## Results

**Summary** — Added a `/workflow` subpage describing the agentic development flow, and a
section on the landing page that summarises it and links there. All three capture paths the
request asked about — voice input, the "Save to Notes" browser extension and AI note taking —
were **not** mentioned anywhere on the site before; they are now the page's opening section.

The subpage tells the loop end to end, using only what tasks 009–031 actually built:

1. **Capture from anywhere** — voice card from the phone browser, the Chrome extension that
   saves a web page onto a board as a note with an AI summary, AI-enhanced dictated notes.
2. **The loop closes itself** — card → `doc/todo/NNN-slug.md` + synced GitHub issue → `/plan`
   pass → move to TODO renames to `-TODO.md` and the local runner spawns Claude Code with
   `/todo NNN` in tmux → Pushbullet/herdr/Remote Control keep the phone in the loop → agent
   appends Results, renames to `-DONE.md`, pushes, webhook moves the card to Review.
3. **Four pieces** — dev-kit plugin, `doc/todo/`, the Kanban board, the runner daemon.

Also fixed the README's stale "Slash commands" table, which still advertised `/prime`,
`/create-plan` and `/implement` writing into `.claude/todo/` — none of which exist any more.

**Files changed**
- Created: `src/routes/workflow/+page.svelte` (198 lines)
- Modified: `src/routes/+page.svelte` — nav link + "An agentic development flow" section
- Modified: `README.md` — current dev-kit slash commands, `doc/todo/` prompt history
- Modified: `package.json` — 0.7.5 → 0.8.0

**Verification**
- `npm run check` — pass (4257 files, 0 errors, 0 warnings)
- `npm run test:unit:server` — pass (1/1)
- Browser (Chrome DevTools, 1280px + mobile width) — both pages render, no console
  errors/warnings, link from `/` → `/workflow` present
- `svelte-autofixer` — clean on the page's Svelte 5 constructs
- `npm run test:unit` (client) and `npm run test:e2e` — **could not run**: the local
  Playwright browser install is corrupt (`chromium_headless_shell-1217` missing,
  `chromium-1217`'s framework dylib absent) and `playwright install chromium` made no
  progress in ~20 min from this session. Pre-existing, unrelated to this change; neither
  suite covers these static marketing pages. Run `npx playwright install --force chromium`
  when the network allows.

**Deviations**
- No follow-up task files were created — the request fit in one session.
- The README fix was outside the literal ask but is the same stale-documentation problem the
  request is about, and it is four lines.
- Note that this repo is the boilerplate: the page says "My App" like the rest of the
  placeholder site, and every project cloned from here inherits `/workflow`. If that is
  unwanted for fresh clones, say so and it can move behind a flag or into `doc/`.
