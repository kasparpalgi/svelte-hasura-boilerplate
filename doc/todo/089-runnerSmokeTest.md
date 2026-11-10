> Run with: Sonnet 5.5 / medium

# End-to-end smoke test for the runner

## Original Requirement

[NEVER REMOVE]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

Runner changes ship to four machines at once, and a broken pickup shows up only as "it
didn't start". Add one `node --test` case in `klarity-claude-kit/plugins/dev-kit/runner`
that builds a bare origin + clone with one `001-x-TODO.md`, puts a fake `claude` on PATH
that renames the file to `-DONE.md` and commits, runs `run.js --once` against a temp
`config.json`, and asserts the file is `-DONE.md` on origin. No herdr, no Kanban.

Acceptance: `npm test` runs it in under 10 s, and breaking `listPending` fails it.
