> Run with: Sonnet 5 / medium

# Machine picker on the Kanban card

## Original Requirement

[NEVER REMOVE]

Follow-up from `027-multipleServersWithHerdr`. The runner half is done and shipped:
two machines, a Mac and Karel, share the queue, and a task file's `> Machine:` line
decides which one runs it (`klarity-claude-kit`,
`plugins/dev-kit/runner/README.md` → *Which machine runs it*).

What is missing is the board half. Today nothing ever writes that line, so Karel's
runner sits idle by design and every task still goes to the Mac. This task adds the
dropdown next to the existing model/effort pickers and makes the task-file writer
emit the line.

Repo: **`svelte-todo-kanban`** (not this one).

### The contract the runner already implements

```
> Run with: Opus 5 / high
> Machine: karel
```

- The value is a **slug**, matched after lowercasing and folding non-alphanumerics
  to `-`. `Karel Ubuntu`, `karel-ubuntu` and `KAREL UBUNTU` are all `karel-ubuntu`.
- The two machines and the ids their runners answer to, as configured today:

  | Board label   | Write this | Runner config on that box                      |
  | ------------- | ---------- | ---------------------------------------------- |
  | Kaspar Mac    | `mac`      | `"machine": ["mac", "kaspar-mac"]`, `machineDefault: true` |
  | Karel Ubuntu  | `karel`    | `"machine": ["karel", "karel-ubuntu"]`         |

  Either spelling lands, but write the short one.
- **Omitting the line is meaningful**: it means *auto*, and the Mac takes it because
  it is the `machineDefault`. So the dropdown's empty/auto state must write no line
  at all — exactly like `agent_model` being unset writes no `> Run with:` line.
- A value neither runner answers to makes the task run **nowhere**, silently. Do not
  invent a third id without adding it to that machine's `config.json` first.

### Work

1. **Card field.** `agent_machine text` on the todos table, nullable — a Hasura
   migration plus metadata (select/insert/update permissions alongside
   `agent_model` / `agent_effort`, which it copies exactly).
2. **GraphQL.** Add it to `src/lib/graphql/documents.ts` wherever `agent_model`
   appears, then `npm run generate`.
3. **`src/lib/server/taskfile.ts`.** `buildTaskFile` and `buildDraftFile` emit
   `> Machine: <slug>` directly under the `> Run with:` line when the field is set,
   and nothing when it is not. `ensureRunWith` has a twin problem worth copying:
   a draft frozen before the machine was picked must be reconciled when the card
   reaches the agent list, or the field is set on the board and absent in the file.
   Slug the value on the way out; do not trust the stored string's spelling.
4. **UI.** A picker beside the model/effort ones in `CardDetailView.svelte`, with an
   *Auto* option that stores null. Labels are display-only — store the slug.
5. **Tests.** `src/lib/server/__tests__/taskfile.test.ts` already covers the
   `> Run with:` line in the same shapes; mirror them: field set, field unset,
   draft reconciled, odd spelling slugged.

### Verify

`npm run check` and `npm test` in `svelte-todo-kanban`. Then end to end: set a card
to Karel, move it to the agent list, and confirm the pushed `-TODO.md` carries
`> Machine: karel`, that `node src/run.js --check` on the **Mac** prints
`[→ karel, not this machine]` next to it, and that Karel picks it up
(`journalctl --user -u kanban-runner -f`).
