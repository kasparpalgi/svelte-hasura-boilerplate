> Run with: Opus 5.5 / xhigh
> Machine: dell

# End-to-end smoke test for the runner

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# End-to-end smoke test for the runner

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

Runner changes ship to four machines at once, and a broken pickup shows up only as "it didn't start". Add one `node --test` case in `klarity-claude-kit/plugins/dev-kit/runner`that builds a bare origin + clone with one `001-x-TODO.md`, puts a fake `claude` on PATH that renames the file to `-DONE.md` and commits, runs `run.js --once` against a temp `config.json`, and asserts the file is `-DONE.md` on origin. No herdr, no Kanban.

Acceptance: `npm test` runs it in under 10 s, and breaking `listPending` fails it.

*GitHub issue #89 — end the commit subject with* `(#89)`*.*

_From Kanban card `30beaada-07e3-4541-b85c-94ad36f159aa`, moved to the agent list._

_GitHub issue #89 — end the commit subject with `(#89)`._
