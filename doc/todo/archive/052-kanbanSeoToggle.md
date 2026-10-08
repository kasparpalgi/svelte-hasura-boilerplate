> Run with: Sonnet 5.5 / medium

# Kanban: SEO toggle when creating/editing a project

## Original Requirement

[NEVER REMOVE]

> one shall be able to set it from some config file or even better when creating a project at Kanban board

Runner side is done (klarity-claude-kit 0.18.0): a board whose `github` JSON contains `"seo": true` gets claude-seo enabled on onboard. Remaining: in the Kanban app (svelte-todo-kanban), add a "Landing / marketing site (enable SEO tools)" checkbox to the board create/edit form that writes `seo: true` into `boards.github`.
