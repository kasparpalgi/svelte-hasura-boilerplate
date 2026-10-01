> Run with: Opus 5.5 / high
> Machine: dell

# Aider

## Original Requirement

[NEVER REMOVE]

Install Aiden on all machines (see ../server) and Add `aider --model gemini/gemini-3.8-flash index.html` into Kanban model dropdown "Gemini 3.8 (free)" into Kanban board and into effort accordingly what it supports (see internet) to use for simple tasks for free that.

_From Kanban card `6140fde2-ce23-42d7-ab90-6cc024eeecd9`._

_GitHub issue #44 — end the commit subject with `(#44)`._

## Results

**Summary** — A Kanban card can now pick **Gemini 3.8 (free)**, which the runner executes
as `aider --model gemini/gemini-3.8-flash --reasoning-effort <low|medium|high>` instead of
Claude. Effort: Gemini 3.8 Flash supports only low / medium (default) / high thinking
([Google docs](https://ai.google.dev/gemini-api/docs/latest-model)), so the card hides
xhigh/max for it and both the board and the runner clamp them to `high`. litellm (bundled
with aider) maps `reasoning_effort` to Gemini's `thinkingLevel`.

- **Runner** (`klarity-claude-kit` `c968bf9`, runner 0.20.0, dev-kit 0.16.0): `gemini`
  family in `classify.js` with `engine: "aider"`; new `src/aider.js` runs aider headless
  with the task file `--read`-only, `--yes-always`, and keeps `.aider*` out of `git status`
  via `.git/info/exclude`. aider auto-commits; the runner's existing autoFinish writes
  Results + `-DONE`. Gemini never steps down on usage limits. **Found in testing:** aider
  exits 0 even when the API rejects every call, which would have produced false DONEs, so
  litellm/auth errors in its output now fail the run.
- **Kanban** (`svelte-todo-kanban` `1d5397a`, 0.19.0): `gemini-3.8` option "Gemini 3.8
  (free)" (en/et/cs), schema + type, task-file label `Gemini 3.8 / <effort>`. No DB change
  needed (the agent_model check was dropped in migration 1805000000000).
- **Server docs** (`server` `4e62e2c`): aider install + key steps in Karel's runner README,
  aider row in Dell's.
- **Installed:** aider 0.86.2 on Dell (`uv tool install aider-chat`, on the runner unit's PATH).

**Files changed** — klarity-claude-kit: `runner/src/aider.js` (new), `runner/src/classify.js`,
`runner/src/run.js`, `runner/test/aider.test.js` (new), `runner/test/classify.test.js`,
`runner/README.md`, `skills/plan/SKILL.md`, versions. svelte-todo-kanban:
`CardDetailView.svelte`, `taskfile.ts` (+ test), `cardHelpers.ts`, `types/todo.ts`, 3 locales,
`package.json`. server: `Dell/` + `Karel/kanban-runner/README.md`. This repo: this file,
`package.json`.

**Verification**
- Runner `npm test`: 103/103 pass.
- Kanban `vitest --project=server`: 267/267 pass. `npm run check`: 17 errors, all already
  there; the count is identical with my change stashed, and none are in the touched files.
- Real aider run in a throwaway repo with the exact runner argv: flags accepted, tree stays
  clean, request reached Google and failed only on the key (`API key not valid`).

**Deviations / left for a human (why BLOCKED)**
1. **No Gemini API key exists on any machine.** Create a free one at aistudio.google.com and
   add `GEMINI_API_KEY=…` to `~/.config/kanban-runner.env` on Dell, Karel and the Mac.
2. **Install aider on Karel and the Mac:** Dell has no SSH key for either (`Permission
   denied (publickey)`). Run `uv tool install aider-chat` on each (steps in
   `server/Karel/kanban-runner/README.md` → "aider"). On the Mac, check that the launchd
   plist's PATH includes `~/.local/bin`.
3. **Restart the runners** (`systemctl --user restart kanban-runner` on Dell). Dell's runner
   started before the new code landed. I committed it here, so self-update sees nothing
   to pull. Karel and the Mac pick it up through self-update.
4. Google's page lists only paid intro pricing for 3.8 Flash and does not confirm a free
   tier. Check AI Studio's rate-limit page once the key exists.
