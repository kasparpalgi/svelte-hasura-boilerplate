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
