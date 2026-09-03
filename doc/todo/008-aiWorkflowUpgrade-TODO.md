Let's update this boilerplate and make it much better.

See what to implement from here https://github.com/affaan-m/ECC#install-with-claude-code - let's make way better the AI workflow. At the moment we use no skills, instincts, memory, security, and research-firstt.

I heared commands will get deprecated? What is the modern way of workflow for how I am used to work: create markdown file to write the promt so I have a nice history of prompt + outcome.

Want to use all the good stuff but obviously not too much stuff to not burn too much token.

---

See also this podcast:

# Stop writing lines of code and stop micro-managing the AI. Become a parallel-processing product manager.

### 1. The Tool Stack (What to Use)

- **Operating System:** **Linux** (DHH recommends his distro, Omarchy, but any Linux setup works). Agents thrive in a CLI/Terminal environment where everything is a config file. Mac and Windows have too many "walled garden" GUI blockers.
- **The Harness (Agent Interface):** **Claude Code**. DHH prefers this because it runs in the terminal, handles multi-agent switching gracefully, and links to a mobile app so you don’t have to sit at your desk waiting.
- **Workspace Management:** **tmux** + **Herdr**. Stop working on one thing at a time. Open multiple terminal panes (tmux). Use Herdr so the terminal goes _ding!_ when an agent needs human review.
- **Code Review Tools:** **Neovim** (for quickly browsing project architecture), **lazygit**, and **Hunk** (to read the diffs the agents generate).
- **The Models:**
  - _For Planning & Building:_ Claude (referred to in the pod as Fable/Opus 5).
  - _For Cross-Checking:_ Grok (for raw speed) or OpenAI (GPT/Codex) to review Claude's work.

### 2. The Workflow (How to Code)

- **Run Parallel Threads:** Never wait for an agent to finish. When one agent is "cooking" a feature, switch to a new terminal tab and start a second agent on a different task. DHH runs up to 16 threads at once.
- **Prompt Outcomes, Not Steps:** Stop writing massive `system_prompts.txt` telling the AI _how_ to code (loops, variables, etc.). Tell it the **fuzzy problem you want solved** or the **business outcome**. The AI writes better code when you get out of its way.
- **The "Agent-to-Agent" Review Loop:**
  1. Have Claude build the feature.
  2. Pass Claude's output to a different model (like OpenAI/Codex).
  3. Have the second model review the code for bugs and race conditions.
- **Push Back on Complexity:** Agents love to over-complicate code (e.g., adding too many early exits or nested conditionals). If the output looks messy, literally reply: _"This looks too complicated. Make it simpler."_ The agent will usually realize its mistake and cut the code in half.
- **Iterative Vibe-Coding:** Don't spec out a massive project upfront. Have the agent build a small piece, test it yourself, see how it _feels_, and then tell the agent what to change based on your gut reaction.

### 3. Advanced Tactics for 10X Speed

- **Stream-of-Consciousness Voice Prompting (Lex’s Method):** For initial app design, don't type. Use a wearable mic (like Plaud) and talk out loud for 10-20 minutes about what you want to build, changing your mind as you speak. Send that raw audio transcript to an agent with access to your codebase to generate the master plan.
- **Let Agents Fix Bugs:** If your app crashes, don't read the logs. Feed the raw, arcane terminal error directly to the agent. Agents are currently vastly superior to humans at finding race conditions and security exploits in logs.
- **Multi-Machine Scaling:** If you max out your local compute, buy cheap mini-PCs, connect them via **Tailscale** (a mesh VPN), and use KVMs to run agents on multiple physical machines at once.

**Summary Mantra:** You are no longer a code-chiseler. You are a director. Set the vision, unleash 5 agents at once in the terminal, review their work, and have fun.

Cursor Composer (exec) + Grok (plan), 20€.

---

Also what do you think of this plan? I have a self-made Kanban board (Svelte/Hasura) where I like to create new items into Backlog column. Ofter on the go via voice input (it has voice input). Then when I move the task to TODO column then would be nice claude code spin it up, devide what model/effort if I don't set it and execute. I think PostgreSQL todo tasks must then sync 2 way between project's doc/todo folder? My Kanban already has Github integration but it creates github issue to connected repo when I create new task.

---

## Also, think how I could have reusable the skills, knowledge here. Eg. I update the .claude/commands/todo.md here as good new idea comes but then I have to do it also on all other projects - tedious. Would be nice if single source of truth so maybe the todo.md is very short and taking general info outside of repo eg ../svelte-hasura-boilerplate?

---

# Answers & session log

> This file was a planning request, not a task. Below: direct answers to the four
> questions, then the slice of work actually shipped, then the follow-ups filed.

## 1. "Are commands deprecated? What's the modern workflow?"

**Not deprecated — merged.** Per the current docs: _"Custom commands have been merged into
skills. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md`
both create `/deploy` and work the same way."_ Existing `commands/` files keep working.

Skills are the better surface because they add frontmatter you cannot get from a command
file: `model`, `effort`, `paths` (load only when touching matching files), `context: fork`
(run in a subagent), `allowed-tools`, `disable-model-invocation`, plus a directory for
supporting files.

**Your markdown-prompt-history habit is already the right workflow — keep it.** `doc/todo/`
_is_ the prompt log: original prompt at the top, outcome at the bottom. Nothing in the
modern tooling replaces it; skills just drive it better.

## 2. What to take from ECC — and what to leave

ECC ships 286 skills, 68 agents, a rules tree, a CLI, an instinct engine and a security
scanner. Installing that wholesale is exactly the token bloat you wanted to avoid. The
_architecture_ is the valuable part, not the volume:

| ECC idea                                      | Verdict            | What was done                                                                                                             |
| --------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Skills over always-loaded rules               | **Take**           | Split the 14 KB `CLAUDE.md` into a 5 KB always-on file + two `paths`-scoped skills that load only when you touch `src/**` |
| Hooks for deterministic checks                | **Take, one hook** | `PostToolUse` → `prettier --write` on the edited file. Zero tokens, enforces the "no global formatter" rule               |
| Research-first                                | **Take, small**    | One `research-first` skill; repo-grep first, then docs, one lookup — not a survey                                         |
| Memory / instincts                            | **Already native** | Claude Code has a per-project memory directory. Writing `feedback` memories _is_ the instinct system. No machinery needed |
| Security scanning                             | **Already native** | `/security-review` is bundled. Wired into `/verify` for auth/secrets/input changes                                        |
| 68 agents, 286 skills, `ecc` CLI, plan canvas | **Leave**          | Cost without payoff at this scale                                                                                         |

## 3. Single source of truth across projects

This was the real problem: editing `.claude/commands/todo.md` in one repo and hand-copying
it to the rest.

**Solution: a Claude Code plugin + marketplace.** This repo now carries
`.claude-plugin/marketplace.json` and a `dev-kit` plugin in `plugins/dev-kit/`. Install once
per machine; every project on that machine gets `/todo`, `/plan`, `/verify` and
`research-first` from that one copy. Edit a skill once → all projects change.

```bash
claude plugin marketplace add ./       # from this repo's root
claude plugin install dev-kit@klarity
```

Do it yourself:
klarity@kaspar-mac GitHub % claude plugin marketplace add ./
Adding marketplace…
✘ Failed to add marketplace: Marketplace file not found at /Users/klarity/Documents/GitHub/.claude-plugin/marketplace.json

Split of responsibility, which is what makes this stay clean:

- **`dev-kit` plugin** — workflow that is true in _every_ project (how a task runs).
- **`.claude/skills/`** in each repo — knowledge true only _here_ (design system, store
  pattern), path-scoped so it costs nothing until relevant.
- **`CLAUDE.md`** — only what must be in context on every single turn.

One wart remains: cloning this boilerplate copies `plugins/dev-kit/` into the new project,
and copies drift. Fixing that means moving the plugin to its own repo → filed as **010**.

## 4. The Kanban → Claude Code plan

Sound, with one correction: **don't build two-way sync.** Postgres ↔ git-folder two-way
means conflict resolution, and you'd spend more time on the sync than on features. Make it
one-way in each direction: the card carries the _request_ and receives only a status + a
link back; the repo owns the _work_. Full design filed as **009**.

## Results

**Summary**

- Answered all four questions above with grounded research (Claude Code plugin/skill docs,
  ECC README).
- Made this repo a Claude Code plugin marketplace (`klarity`) shipping the `dev-kit` plugin
  — the single source of truth for the workflow across projects.
- Wrote four skills: `todo` (canonical, path-corrected to `doc/todo/`, with an explicit
  simplify pass), `plan` (replaces the never-implemented `/create-plan`), `verify` (the
  project's real verification chain incl. the `fallow --base` pitfall), and `research-first`
  (model-invoked).
- Added one `PostToolUse` hook: per-file `prettier --write`. Deterministic, zero tokens.
- **Cut always-loaded context 64%**: `CLAUDE.md` 14036 → 5046 bytes, by moving the design
  system and code conventions into `paths`-scoped project skills that load only when
  touching `src/**`.
- Installed and verified the plugin end-to-end on this machine.
- Filed 009 / 010 / 011, each with a model + effort header and sized for one session.

**Files changed**

- Created: `.claude-plugin/marketplace.json`, `plugins/dev-kit/.claude-plugin/plugin.json`,
  `plugins/dev-kit/README.md`, `plugins/dev-kit/hooks/hooks.json`,
  `plugins/dev-kit/skills/{todo,plan,verify,research-first}/SKILL.md`,
  `.claude/skills/{svelte-conventions,design-system}/SKILL.md`,
  `doc/todo/009-kanbanTodoSync-TODO.md`, `doc/todo/010-extractDevKitPlugin-TODO.md`,
  `doc/todo/011-parallelReviewLoop-TODO.md`
- Modified: `CLAUDE.md` (slimmed), `shell-aliases.md` (stale `/create-plan` `/implement`
  and `.claude/todo/` references corrected), `package.json` (version)
- Deleted: `.claude/commands/todo.md` (superseded by the plugin skill — kept nowhere else,
  so it cannot drift)

**Verification**

- [x] `claude plugin validate ./plugins/dev-kit` → passed
- [x] `claude plugin install dev-kit@klarity` → installed, listed, enabled
- [x] All three JSON files parse
- [x] Hook command dry-run exits 0 on a sample payload
- [x] `npx prettier --check` clean on every changed file
- [ ] `npm run check` / tests — not run: no `src/` or config code changed this session
- [ ] `npx fallow audit` — not run: no JS/TS changed this session

**Deviations**

- `/implement` was not ported. It duplicated `/todo` (both "execute a plan file") and
  neither `/create-plan` nor `/implement` ever existed as files despite being documented.
  `/plan` + `/todo` covers it with one fewer moving part.
- Only one hook shipped rather than a hook profile. More hooks means more that can break
  silently; add the second one when a real need shows up.
