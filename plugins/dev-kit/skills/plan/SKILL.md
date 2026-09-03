---
name: plan
description: Turn a request into a new numbered task file in doc/todo/ without implementing it. Use when the user types /plan or asks to plan a feature before building.
argument-hint: '[request]'
disable-model-invocation: true
---

# Plan: $ARGUMENTS

Research first, then write **one file** — do not implement.

1. Read the codebase parts the request touches. Check `doc/todo/` for related past tasks.
2. Pick the next free number in `doc/todo/`.
3. Write `doc/todo/<NNN>-<camelCaseName>-TODO.md`:

```markdown
> Run with: <Opus 5 | Sonnet 5 | Haiku 4.5> / <low | medium | high>

# <Task name>

## Original Requirement

$ARGUMENTS

## Analysis

- Affected files:
- Unknowns / decisions needed:

## Implementation Plan

1.

## Verification

- [ ] `npm run check`
- [ ] tests
- [ ] browser-tested
```

4. If the request is genuinely more than one session, split it across several numbered
   files instead of one giant one. Each file must be independently runnable via `/todo <n>`.
5. Report the file path(s) and stop. Do not start building.
