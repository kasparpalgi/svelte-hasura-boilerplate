> Run with: Opus 5.5 / high
> Machine: dell

# Superpowers and apply new things to all repos

## Original Requirement

[NEVER REMOVE]

To all repos in klarity-claude-kit config.json

Implement what makes sense: <https://github.com/obra/superpowers>

Think also all landingpages: <https://github.com/AgricIDaniel/claude-seo> or what's best?

And search: <https://exa.ai/> or what's best

_From Kanban card `4da525a6-d1ff-4808-a9cd-b06302947e88`._

_GitHub issue #37 — end the commit subject with `(#37)`._

## Results

**Summary**

Answers to the three questions:

- **Superpowers** — not installed wholesale. Its `brainstorming`, `using-git-worktrees` and
  `finishing-a-development-branch` skills ask questions and branch per task, which fights
  the unattended Kanban runner (main branch, `/todo` → `-DONE.md`). Its planning,
  verification-before-completion and code-review ideas are already covered by `/plan`,
  `/todo`, `/verify` and `/cross-review`. The one real gap was **systematic debugging**, so
  it is ported as a short `debug` skill in dev-kit (auto-invoked on bug fixes; MIT credited).
  Because dev-kit is the shared plugin, every repo in `config.json` gets it on plugin update.
- **Search** — Exa is the right pick: neural + code-context search, hosted MCP works
  **keyless and free** (rate-limited), and `research-first` already pointed at
  `web_search_exa`. Bundled in dev-kit's `.mcp.json`, so it reaches every repo with no
  per-repo config. Tavily/Brave would need API keys on every runner machine.
- **Landing pages** — claude-seo is the best option (MIT, free core), but it is too heavy to
  enable globally. Filed as Backlog follow-up `048-claudeSeoLandingPages.md` (needs a human
  to confirm which repos are public marketing sites).

**Files changed**

- klarity-claude-kit `b39029a`: created `plugins/dev-kit/.mcp.json`,
  `plugins/dev-kit/skills/debug/SKILL.md`; modified `plugins/dev-kit/README.md`,
  `plugins/dev-kit/.claude-plugin/plugin.json` (0.16.0 → 0.17.0)
- this repo: created `doc/todo/048-claudeSeoLandingPages.md`; `package.json` 0.14.0 → 0.15.0

**Verification**

- `claude plugin validate plugins/dev-kit` — passed
- `claude --plugin-dir plugins/dev-kit mcp list` — `plugin:dev-kit:exa: https://mcp.exa.ai/mcp (HTTP) - ✔ Connected` (no key)
- No app code changed here, so `npm run check` / tests not applicable.

**Deviations**

- Work landed in `klarity-claude-kit` (the shared plugin) rather than editing each repo —
  that is what makes it apply to all repos. Machines must run `/plugin` update (or the
  runner's own update) to pick up dev-kit 0.17.0; this machine still shows 0.14.1.
