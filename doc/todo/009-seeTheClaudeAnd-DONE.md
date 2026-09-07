# See the .claude and provide prompt/instructions

## Original Requirement

[NEVER REMOVE]

See this repos .claude and if any AI instructions / skills / etc in this repo and at ../klarity-claude-kit repo and provide instructions + prompt in some logical location (README or from readme link to that file) and tell me where did you added.

_From Kanban card `a265a071-c157-46c9-b08e-b9d10c303d60`._

_GitHub issue #9 — end the commit subject with `(#9)`._

## Results

**Summary** — Audited AI instructions/skills in both this repo's `.claude/` and the
`../klarity-claude-kit` repo, then extended `README.md`'s existing "AI Tooling" section (it
already listed `CLAUDE.md`/`AGENTS.md`/`GEMINI.md` and the `/plan`, `/todo`, `/verify`,
`/security-review` slash commands) with the parts that were missing:
- The two auto-loading `dev-kit` skills (`research-first`, `cross-review`) that aren't typed as
  slash commands, plus a link to the Kanban runner that fires `/todo` from a board.
- A table of this repo's two project-specific, path-scoped skills under `.claude/skills/`
  (`svelte-conventions`, `design-system`) that weren't mentioned in the README before, only in
  `CLAUDE.md`.

**Files changed** — modified: `README.md` (new paragraph + table under "AI Tooling"),
`package.json` (patch bump), `doc/todo/009-seeTheClaudeAnd-TODO.md` (this section).

**Verification** — Documentation-only change; no code/build/test surface touched, so
`npm run check` / `npm test` were not re-run. Reviewed the rendered Markdown diff by eye.

**Deviations** — None. Where I added it: `README.md`, under the existing `## AI Tooling` heading.
