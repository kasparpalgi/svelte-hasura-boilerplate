add skill /todo and if I add after that eg. 002 then it will replace as of I would copy paste here from /.claude/prompt.md content and then add 002 at the end

## Result

Skill file created at `~/.claude/skills/todo.md`:

```
See `/CLAUDE.md` and see files in `.claude` folder. Then do the task from `.claude/todo` folder: #$ARGS
```

- `/todo` — runs the prompt without a task number
- `/todo 003` — expands to the prompt with `#003` at the end
- `$ARGS` is substituted with whatever argument is passed after the skill name
- Skill files in `~/.claude/skills/` are plain prompt text, no frontmatter needed