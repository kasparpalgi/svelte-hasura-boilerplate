> Run with: Sonnet 5.5 / medium
> Machine: karel

# Enable claude-seo in the landing-page repos

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5 / medium

# Enable claude-seo in the landing-page repos

## Original Requirement

\[NEVER REMOVE\]

Split out of task 037 ("Superpowers and apply new things to all repos"):

> Think also all landingpages: <https://github.com/AgricIDaniel/claude-seo> or what's best?

## Plan

claude-seo (MIT, no paid services needed) is the best fit, but it is large (26 sub-skills, 19 agents). Enabling it globally would load its skill list into every repo, so enable it **per project, only in landing / marketing sites**.

1. Once per machine: `claude plugin marketplace add AgriciDaniel/claude-seo`.
2. In each landing repo, add to `.claude/settings.json`: `"enabledPlugins": { "claude-seo@agricidaniel-claude-seo": true }` (and the `extraKnownMarketplaces` entry so other machines/runners pick it up).
3. Candidates from `klarity-claude-kit` `config.json`: `ezyspace-landing`, `tekdok-landing`, `ezysmart-web`, `profitelgid`, `e-stonia`, `kirjanduse-selts`. **Human: confirm which are public marketing sites.**
4. Run `/seo audit <url>` on one site and file its top fixes as Backlog tasks in that repo.

_From Kanban card `e5803e5f-1a82-43ac-88ab-6926910dc1aa`._

## Results

**Summary** — No code change. This repo is a boilerplate, not a landing page, so claude-seo is not enabled here. Step 3 of the plan explicitly needs a human to confirm which candidate repos (`ezyspace-landing`, `tekdok-landing`, `ezysmart-web`, `profitelgid`, `e-stonia`, `kirjanduse-selts`) are public marketing sites. The per-repo edits live in those other repos, so I did not touch them.
**Files changed** — only this task file (Results appended, renamed to `-BLOCKED.md`).
**Verification** — N/A, no code changed.
**Deviations** — None.

**Needed from a human**
1. Confirm which of the candidate repos are public marketing sites.
2. Run once per machine: `claude plugin marketplace add AgriciDaniel/claude-seo`.
3. In each confirmed repo, add to `.claude/settings.json`: `"enabledPlugins": { "claude-seo@agricidaniel-claude-seo": true }` plus the matching `extraKnownMarketplaces` entry.
4. Run `/seo audit <url>` on one site and file the top fixes as Backlog tasks in that repo.

## Results (update, after human confirmed the sites)

**Summary** — Human confirmed SEO sites: ezyspace-landing, tekdok-landing, profitelgid, e-stonia, kirjanduse-selts. Added `claude-seo` as an opt-in plugin in the klarity runner: the `seo` list in runner `config.json` or `"seo": true` in a board's `github` JSON makes the scaffold enable `claude-seo@agricidaniel-claude-seo` (plus its marketplace) in that repo's `.claude/settings.json`. Marketplace added on this machine; all five repos enabled, committed and pushed. `/seo audit https://e-stonia.co.uk` ran; top fixes filed as Backlog tasks 049–051 in the e-stonia repo.
**Files changed** — klarity-claude-kit: `runner/src/scaffold.js`, `runner/src/onboard.js`, `runner/test/onboard.test.js`, `runner/README.md`, `plugin.json` (0.18.0). Five repos' `.claude/settings.json`. e-stonia `.claude/todo/049–051`.
**Verification** — runner `npm test` 104/104 pass; `/seo` ran in e-stonia headless. No app code changed here.
**Deviations** — The Kanban "create project" UI toggle is not built (that is the Kanban app's code); follow-up filed as 052 (Backlog). Other machines (karel, dell) need `claude plugin marketplace add AgriciDaniel/claude-seo` once; the runner's onboard `--all` applies it.
