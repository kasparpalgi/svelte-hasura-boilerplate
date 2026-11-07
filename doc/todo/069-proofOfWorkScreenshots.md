> Run with: Sonnet 5.5 / high

# Proof of work: screenshots on the card

## Original Requirement

[NEVER REMOVE]

Follow-up from #59. Symphony's agents hand in **proof of work** with each ticket (CI status,
review feedback, walkthrough videos); Vibe Kanban and Emdash put a live app preview next to
the diff. Our Review column gets text only, so every UI card means pulling and running the app.

- `/verify` (dev-kit) already drives Playwright. For a task that changed UI, save 1–3
  screenshots as `<task dir>/NNN-slug-*.png` — gitignored like `NNN-slug.log`, so they never
  dirty the tree.
- When the runner closes the loop (`kanban.js` `closeLoop`), upload them to the card as
  attachments. Use the Kanban's existing upload path (R2), not a new store.
- No screenshots → no change.

## Acceptance criteria

- [ ] A UI task's card in Review shows its screenshots as attachments.
- [ ] The PNGs never reach git (gitignore entry written the way `*.log` is).
- [ ] A non-UI task behaves exactly as today.
