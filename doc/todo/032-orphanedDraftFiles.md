> Run with: Sonnet 5 / medium

# Orphaned draft files when a card reaches the agent list

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5 / medium

# Orphaned draft files when a card reaches the agent list

## Original Requirement

\[NEVER REMOVE\]

Found while running `028-task27Fix`. Repo: `svelte-todo-kanban` (not this one).

`writeTaskFile` in `src/routes/api/github/write-task-file/+server.ts` is meant to *replace* the draft: it PUTs `NNN-slug-TODO.md`, then DELETEs the draft it came from and commits that as `docs(todo): replace <draft> with <todo>`.

For card `c7565488-7f74-4498-8d47-8029f3ee1d79` the PUT happened and the DELETE did not. The result was two files for one card in this repo:

- `doc/todo/031-task27Fix.md` — the draft, last written 13:57
- `doc/todo/028-task27Fix-TODO.md` — the task file, written 14:23, no `replace` commit

The `031` orphan was deleted by hand at the end of `028`. The bug that made it is still there.

### What is worth checking

- The draft was renumbered on the way out: the file was `031-`, the issue is #28, so `todoPathFor` produced `028-…-TODO.md`. A draft whose number *changes* is the case that differs from the ones that work (kanban `417a295` shows `199-` → `199-…-TODO`deleting cleanly). Start there.
- `fileInfo.sha` is read once, before the PUT, and reused for the DELETE. Check whether the PUT moving the branch head makes that sha stale enough for a 409.
- The DELETE is awaited but its failure mode is unclear from the outside — the card still got its "Task file ready" comment, so either the error was swallowed or the DELETE never ran. Make the failure visible either way (`serverLog`).
- An orphan is not harmless-but-ugly: it is a second file for the same card. It is suffixless, so the runner never auto-runs it, but it does confuse `/todo <number>`, which is how it was found.

### Verify

A unit test in `src/routes/api/github/__tests__/write-task-file.test.ts` covering a draft whose number changes, asserting the DELETE is issued with the draft's path. Then move a real card to the agent list and confirm only one file remains.

_From Kanban card `8ee6cfc9-46af-44a9-b22b-46711ffcd2c8`._
