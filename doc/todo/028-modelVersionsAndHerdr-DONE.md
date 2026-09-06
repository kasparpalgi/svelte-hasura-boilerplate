1. Update ~/Documents/GitHub/klarity-claude-kit/plugins/dev-kit/runner/src/classify.js

const TIERS = {
  opus: { model: "opus", effort: "high", label: "Opus 5 / high" },
  sonnet: { model: "sonnet", effort: "medium", label: "Sonnet 5 / medium" },
  haiku: { model: "haiku", effort: "low", label: "Haiku 4.5 / low" },
};

Add Sonnet 4.6 instead Sonnet 5. Opus have also 4.6 and 4.8. Leave 5 too. I want to be able to define myself or let AI decide between different versions and efforts from low to xhigh.

2. Where I can see Herdr on Mac and on my Win? Browser URL? What's the URL? 

3. There's one kanban board runner where is no agents. How to delete that from web on mobile or somewhere else? 

4. Did new test with `svelte-todo-kanban` created card in TODO list with first top row "Sonnet 4.6 / low" but it started with Sonnet 5. Then it almost seemed to be finished and all good and in mobile Herdr showed in the middle of work the agent session disappear. No Telegram. Then it appeared again and agent said quickly after checking few files that task is actually complete and that session closed, too. Now on Pushbullet:
Runner ⚠ did not finish
kasparpalgi/svelte-todo-kanban 157-errors-TODO.md

157-errors-TODO.md was never renamed to -DONE


⏺ Confirms the log: 9 remaining errors are unrelated
  pre-existing type issues, module-not-found errors are gone.
  The task was already completed and committed (66cd03e). No
  further action needed — status is DONE, no uncommitted
  changes to make.

✻ Crunched for 33s · done 1:26 PM
                                                56864 tokens
──────────────────────────────────────────────────────────────
❯ 
──────────────────────────────────────────────────────────────
  model Sonnet 5  week 47%  ctx 55k  session 71%  main  res…
  ⏵⏵ bypass permissions on (shift+tab to cycle) · ← for age…
                                                         /rc

Runner ⏭ stuck task
kasparpalgi/svelte-todo-kanban 157-errors-TODO.md

Ran twice without renaming to -DONE. Skipped so the queue advances — edit the file to retry.
---

## Answers

### 2. Where do I see Herdr — Mac and Windows?

The phone/browser UI is the **herdr-mobile-relay** plugin. It listens on `127.0.0.1:8375`
and a `cloudflared` tunnel publishes it:

| From | URL |
| ---- | --- |
| **Mac** (this machine) | `http://127.0.0.1:8375` |
| **Windows, phone, anywhere else** | `https://herdr.servicehost.io` |
| **Mac terminal, native TUI** | just run `herdr` |

The relay binds to loopback only (`lsof` confirms `TCP 127.0.0.1:8375 (LISTEN)`), so the
Mac's LAN IP will **not** work from Windows — `herdr.servicehost.io` is the only route in
from another machine. Config: `~/.config/herdr/plugins/config/herdr-mobile-relay.events/`
(`cloudflared/config.yml` maps `herdr.servicehost.io` → `127.0.0.1:8375`).

### 3. The kanban runner with no agents — how do I delete it?

Checked live:

```
workspace w3  label "runner"  1 tab  0 agents
agents: []
```

**That is not a stuck runner — it is the runner's home workspace idling between tasks.**
`ensureWorkspace()` in `runner/src/herdr.js` creates one workspace labelled `runner` and
reuses it forever; each task then gets its own `task-NNN` tab, which `runInHerdr()`
closes in its `finally`. Between tasks you are left with exactly what you saw: the
workspace, its base tab, and no agents. Zero agents is the healthy idle state.

If you still want it gone:

- **CLI:** `herdr workspace close w3`
- **Phone/web:** close the workspace from the workspace list at `herdr.servicehost.io`

I deliberately did **not** delete it. `ensureWorkspace()` grabs `workspaces[0]` if any
exists and otherwise creates one — and the comment there warns that the first workspace
after a cold server start "can take minutes". Deleting it only makes the next task's
startup slow. Delete it if the pane is visibly wedged, not because it looks empty.

### 4. Why "Sonnet 4.6 / low" ran as Sonnet 5

Found and fixed — it was two bugs on the same path, and neither was random.

**The card label was right.** `.claude/todo/157-errors-TODO.md` really did start with
`> Run with: Sonnet 4.6 / low`.

**Bug A — the runner threw the version away.** `classify.js` matched only the *family*
name and passed `--model sonnet`, which always resolves to the current Sonnet. The old
code said so in a comment and the README documented it as intentional: "A version number
after it is ignored on purpose." So every `Sonnet 4.6` card had been running Sonnet 5.
Verified all six pinned ids actually work as `--model` values before wiring them in
(`claude-sonnet-4-6`, `claude-opus-4-6`, `claude-opus-4-8`, `claude-opus-5`,
`claude-sonnet-5`, `claude-haiku-4-5` all answer; `claude-fable-5-1` returns "requires
usage credits").

**Bug B — the writer threw it away too.** In `taskfile.ts`, `MODEL_NAMES` mapped the
card's `agent_model` field to a fixed label, so a card set to `sonnet` was written as
`Sonnet 5` no matter what. That path *wins* over the card's prose, so once the model
dropdown (task-161) is used, the typed version never had a chance.

Also fixed while in there: that table emitted `Opus 5 / hard`, and `hard` is not a real
effort — the runner silently discarded it and used the family default.

**The 157 wedge.** The agent did the work, committed it (66cd03e), decided the task was
already complete, and stopped — without appending `## Results` or renaming to `-DONE`.
The runner behaved correctly: `⚠ did not finish`, re-ran, then `⏭ stuck task`. The work
was genuinely done, so I appended the Results section and renamed it to
`157-errors-DONE.md`. The reason an agent can walk past that step is filed as **task-030**.

**Not explained:** the pane disappearing mid-work on the phone and the missing Telegram
notification. I could not reproduce it from the logs and did not want to guess; it is
written up with the leads I have (`reap()` vs. an overlapping tick) in task-030.

---

## Results

**Summary** — Model versions are now honoured end to end. A card asking for
`Sonnet 4.6 / low` starts `claude --model claude-sonnet-4-6 --effort low` instead of
silently getting Sonnet 5. Efforts gained `xhigh` and `max`. Answered questions 2 and 3
above, closed the stuck 157 task, and split the rest into tasks 029 and 030.

**Files changed**

*`klarity-claude-kit`*
- modified `plugins/dev-kit/runner/src/classify.js` — replaced the flat 3-entry `TIERS`
  table with a `FAMILIES` table carrying each family's known versions, its latest, and
  its default effort. `tier(family, version, effort)` resolves to a full model id.
  An unknown version falls back to the family's latest instead of failing the run; an
  unknown effort falls back to the family's default. Also fixed a latent crash: the
  classifier prompt offered `fable` but `TIERS` had no `fable` key, so any card saying
  "Run with: fable" would have thrown on `tier.label`. Fable is now reachable by name
  only and never auto-selected, since it bills usage credits.
- modified `plugins/dev-kit/runner/README.md` — rewrote "Model & effort"; it previously
  documented the version being ignored as deliberate behaviour.
- modified `plugins/dev-kit/skills/plan/SKILL.md`, `skills/todo/SKILL.md` — the
  `Run with:` grammar now shows the version choices and all five efforts.
- bumped `plugin.json` 0.6.1 → **0.7.0** and `runner/package.json` 0.4.1 → **0.5.0**.

*`svelte-todo-kanban`*
- modified `src/lib/server/taskfile.ts` — `FAMILIES`/`label()` mirror the runner;
  `fieldLabel()` reads a version-pinned `agent_model` (`sonnet-4.6`, `opus-4.8`) while
  bare families still mean "latest", so existing cards are unaffected. Collapsed the two
  duplicated model alternations into one shared regex, keeping the "explicit `Run with:`
  beats a bare mention" precedence.
- modified `src/lib/server/__tests__/taskfile.test.ts` — corrected the `/ hard`
  expectations, added coverage for `xhigh` and for the precedence rule.
- renamed `.claude/todo/157-errors-TODO.md` → `-DONE.md` with a Results section.
- bumped `package.json` 0.12.0 → **0.12.1**.

*this repo*
- created `doc/todo/029-cardVersionDropdown-TODO.md` — board UI for versions + xhigh/max.
- created `doc/todo/030-agentMustRenameOrSayWhy-TODO.md` — the un-renamed-file gap.
- bumped `package.json` 0.6.1 → **0.7.0**.

**Verification**
- Model ids probed against the real CLI — all six pinned ids answer; `claude-fable-5-1`
  reports it needs usage credits.
- `explicitTier` unit-checked on 10 inputs including `Sonnet 4.6 / low`,
  `Opus 4.8 / xhigh`, a bare `opus`, an unknown version (`Sonnet 9.9` → Sonnet 5), a
  bogus effort, and the `"Run with: opus\n\n5 things"` trap where a naive `\s*` would
  swallow the `5` as a version. All correct.
- `npx vitest run src/lib/server/__tests__/taskfile.test.ts --project server` —
  **25/25 pass**.
- `npm run check` in `svelte-todo-kanban` — 9 errors, 4 warnings, **none in the files
  touched here**; identical to the pre-existing count recorded in the 157 log.
- End-to-end: a card with `agent_model: "sonnet-4.6", agent_effort: "low"` now produces
  `> Run with: Sonnet 4.6 / low`, which `classify.js` resolves to
  `claude-sonnet-4-6` / `low`.

**Deviations**
- One behaviour change beyond the ask: the old table hard-coded `sonnet 4.6 ⇒ low
  effort`, so naming that version silently also set the effort. Effort now always comes
  from the family default (sonnet ⇒ medium) unless written after the slash. That is the
  same version/effort conflation this task was asked to remove, so I removed it rather
  than preserving it; one test was updated to match. Cards set through the dropdown
  always carry an explicit effort, so nothing on the board changes.
- Item 1 asked to add versions to the runner's table. The board cannot yet *select* one —
  its dropdown still offers families only. That is UI work in another repo, so it is
  task-029 rather than being wedged in here.
- Did not delete the empty herdr workspace (reasoning under question 3).
