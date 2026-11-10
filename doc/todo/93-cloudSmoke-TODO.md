> Run with: Sonnet 5.5 / low
> Machine: cloud

# Cloud smoke test

## Original Requirement

[NEVER REMOVE]

Test card for #86 (Cloud as a machine). Nothing to build: this card proves that a Cloud card ends as a pull request with a `-DONE.md`.

In Results, report which of this repo's checks run in a cloud VM: `npm ci`, `npm run check` and `npm run test:unit:all -- --run`. For each one that fails, say whether that's down to Hasura, a database or the network being missing. Don't fix anything, and change no file except this task file (no version bump: nothing ships).

_From Kanban card `82d00a35-3432-493c-875a-be1a8158abbc`, moved to the agent list._

_GitHub issue #93 — end the commit subject with `(#93)`._
