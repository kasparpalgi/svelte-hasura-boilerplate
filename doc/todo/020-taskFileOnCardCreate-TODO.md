> Run with: Sonnet 5 / medium

# Write task file when card is created (Backlog), rename to -TODO on column move

## Original Requirement

[NEVER REMOVE]

From 017: "I would expect it to create the file already when its in backlog and when I move
it to TODO then it will rename file and add -TODO to file name and start executing."

Currently task 014 writes the file only on move to the agent list. The user wants every card
to have a file from birth — the repo becomes the complete prompt history.

## Design

Changes in `svelte-todo-kanban`:

### On card creation (any column)
- Write `NNN-slug.md` to the repo (no `-TODO` suffix)
- Same format as now, minus the "moved to TODO" trailer
- Only for boards with a connected GitHub repo

### On move to the agent list
- Rename `NNN-slug.md` → `NNN-slug-TODO.md` via the GitHub Contents API
  (delete old + create new, since the API has no rename)
- The runner picks up `-TODO.md` files as before

### On card body edit
- Update the file content (PUT with the existing SHA)
- This way the prompt can be refined before moving to TODO

## Watch out for

- **Numbering:** currently assigned on move to agent list. Now assigned on card creation.
  The number must be stable — don't renumber on rename.
- **Cards without content:** a card with only a title should still get a file (title as
  the heading, empty body). The user often creates the card first and adds content later.
- **Existing cards:** don't retroactively create files for 100+ existing cards. Only new
  cards going forward.
- **Delete card → delete file?** Probably yes, but confirm with the user.

## Verification

- [ ] Creating a card in Backlog writes `NNN-slug.md` to GitHub
- [ ] Editing the card body updates the file
- [ ] Moving to the agent list renames to `NNN-slug-TODO.md`
- [ ] The file number doesn't change across edits or moves
- [ ] Cards on boards without GitHub repos are unaffected
