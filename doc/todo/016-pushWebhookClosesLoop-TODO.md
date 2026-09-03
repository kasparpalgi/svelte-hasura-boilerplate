> Run with: Sonnet 5 / medium

# The push back to GitHub updates the issue and the card

## Original Requirement

[NEVER REMOVE]

From the second pass of `009` — the tail of the user's step 7:

> User pulls md and executes. **MD gets updated. Issue gets updated. Kanban todo item gets
> updated.**

This is layer ③: the return leg. The user pushes; todzz.eu notices and closes the loop.
**Blocked on `014`** (nothing to report on until the server writes task files).

## Why this needs no new infrastructure

`../svelte-todo-kanban/src/routes/api/github/webhook/+server.ts` already exists, is already
registered per board by `register-webhook`, and already verifies its signature (there are
tests at `webhook/__tests__/signature.test.ts`). This adds a `push` case to a handler that
is already receiving events.

## Design

1. Subscribe to `push` alongside whatever `register-webhook` requests today.
2. In the payload, look for a commit that renames `doc/todo/NNN-*-TODO.md` →
   `doc/todo/NNN-*-DONE.md` (GitHub gives `added` + `removed` per commit; the `NNN` is the
   join key back to the card recorded in `014`).
3. On a match: move the card to the board's "done" list if one is designated, comment the
   commit SHA and a link to the file at that SHA, and close the linked GitHub issue —
   `todos.github_issue_number` already exists on the table.
4. A `-TODO.md` that came back still named `-TODO.md` means the session stopped for a human.
   Comment that, and leave the card where it is.

## Watch out for

- Signature verification is not optional — reuse the existing path, do not add a second one.
- Force-pushes and rebases replay old commits. Ignore a rename for a card already reported.
- The repo is the user's; a push may contain a hundred unrelated commits. Scan cheaply and
  match nothing rather than guessing.
- A board with no designated done list should still comment. Only the move is optional.

## Verification

- [ ] A real push renaming `NNN-*-TODO.md` → `-DONE.md` moves and comments the card
- [ ] The linked GitHub issue closes
- [ ] An unrelated push does nothing
- [ ] A replayed/force-pushed commit does not double-report
- [ ] An unsigned or wrongly-signed delivery is rejected
