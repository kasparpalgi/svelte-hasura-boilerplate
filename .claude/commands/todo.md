# Todo

Open and execute a task from `.claude/todo/` by number.

## Variables

task_number: $ARGUMENTS (e.g. `001`)

---

## Instructions

1. Find the file in `.claude/todo/` whose name starts with `$ARGUMENTS` (e.g. `001-some-task.md`).
2. Read it fully.
3. If it contains only placeholder text, report that no real task exists yet.
4. Otherwise, execute it using the same process as `/implement`:
   - Follow each step in order
   - Run `svelte-autofixer` on every `.svelte` file written
   - Run `npm run check` after TypeScript/Svelte changes
   - Use `displayMessage()` for user feedback, `loggingStore` for production logs
   - No global prettier runs
5. After completion, update the task file: check off verification items and add a `## Results` section.
