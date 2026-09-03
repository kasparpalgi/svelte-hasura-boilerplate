---
name: todo
description: Open and execute a numbered task file from doc/todo/ — the markdown prompt+outcome log. Use when the user types /todo <number> or asks to run a numbered task.
argument-hint: '[number]'
disable-model-invocation: true
---

# Run task `$ARGUMENTS`

The `doc/todo/` folder is the prompt history: one markdown file per request, holding the
original prompt at the top and the outcome at the bottom. Never rewrite the top part.

## 1. Load

Find the file in `doc/todo/` whose name starts with `$ARGUMENTS`. Read it.

## 2. Classify

| The file is…                                        | Do this                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A concrete, actionable task                         | Execute it (step 3 onward)                                                                                                                                                                                              |
| Planning / open questions / bigger than one session | Answer the questions in the file, then split it into new numbered task files in `doc/todo/` (next free numbers). Do a reasonable slice of real work this session. Steps 3–6 apply only to the slice you actually built. |

Every task file you create starts with a frontmatter line naming the model and effort:
`> Run with: Opus 5 / high` — hard architecture; `Sonnet 5 / medium` — normal features;
`Haiku 4.5 / low` — mechanical edits. Size each file to one session.

## 3. Build

- Golden rule: **simplicity is GENIUS.** Files ~100 lines, 200 max.
- Research before writing unfamiliar API code — see the `research-first` skill.
- Follow the project's own conventions skills (they auto-load from `paths`).

## 4. Simplify pass

Re-read your own diff with a cold eye. You almost certainly over-built something —
LLMs do it nearly every time. Cut it now. If context is running out, file a follow-up
task instead of leaving the complexity in.

## 5. Verify

Run `/verify` (or the `verify` skill). Only the checks that match what you changed.

## 6. Log the outcome

Append to the task file:

```markdown
## Results

**Summary** — what got built
**Files changed** — created / modified / deleted
**Verification** — status of each check
**Deviations** — changes from the plan, or "None"
```

Then rename the file to describe itself:
`008-aiWorkflow-DONE.md` (complete) or `008-aiWorkflow-TODO.md` (needs a human).

Bump `package.json` version — PATCH for fixes, MINOR for features.

## 7. Ship

Only when verification is green:

```bash
git pull && git add -A && git commit -m "<conventional commit subject>" && git push origin main
```

Respect the project `CLAUDE.md`: if it says not to commit, stop after step 6 and report.
