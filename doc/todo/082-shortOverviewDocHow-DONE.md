> Run with: Opus 5.5 / high
> Machine: dell
> Plan first

# Short doc how the thing works

## Original Requirement

[NEVER REMOVE]

Write shortly how it works technically: 

1. Kanban board task, pick model/effort/machine
2. Github issue is created and TODO task in a file system (see in the card screenshot top there's clickable link `082-shortOverviewDocHow.md` that is pulled to all 4 worker machines that have 4 different €18 Claude Code subscriptions as I have my own one + 3 of my friends are non-tech and use &lt;50% their weekly usage. I make sure their tokens get nicely burned. All todo files are kept in repo `doc/todo` folder. In every 20sec sync happens.
3. When I move the task to the "TODO" list in Kanban board then the file is renamed to `082-shortOverviewDocHow-TODO.md` and in every 20sec the runner (free Gemini model) sees if there's any todo files with "TODO" in file name and if there is then Claude Code session in herdr is started in the right machine with right model/effort. If model/effort/machine left to "auto" then the runner will pick the right model/effort depending on the compelxity of the task and the right machine depending on the usage left on that machine.
4. I can see in real time what is going on in the session from herdr from my phone or any other device. When Claude gets blocked, finishes or has questions then I get a notification beep on my phone and my watch vibrates on my arm. I can one-click pick the answer from Claude's suggested answer options quickly on the go or speak into herdr what I want to tell to the session.
5. Once complete the task file is renamed so the TODO in the filename will be replaced with DONE or BLOCKED. Inside the todo file below my requirements (my initial request is always kept in the top of the file) there will be added first the plan how the model plans to do the task and how to verify it. Below what was done, what files changed, how was tested etc.
6. I like it because I can refer to previous todo tasks easily eg. say "See in todo 138 feature X was developed and 277 fixed there Y so now check why..."

Write more and compare it toClaude desktop. Write where my system is better (eg. can have multiple subscriptions and nicer project management in Kanban) and where Claude desktop and mobile apps beat me as they have got much better recently.

_From Kanban card `0df02395-a482-4421-b56b-5a54166b91cc`, moved to the agent list._

_GitHub issue #82 — end the commit subject with `(#82)`._

---

## Plan

1. Read the runner README and source (`klarity-claude-kit/plugins/dev-kit/runner`) so the
   doc describes what the system actually does, not just the card text.
2. Write `doc/how-it-works.md` (~100 lines): the pieces, the loop in 8 steps, why the
   `doc/todo/` history matters, and a fair comparison with the Claude desktop/mobile apps.
3. Link it from `README.md`.
4. Verify: `prettier --check` on the changed markdown; no code changed, so no test run.

## Results

**Summary** — Wrote `doc/how-it-works.md`: the pieces table, the loop step by step
(card → draft file + issue → TODO rename → runner pickup/claim → herdr run →
phone notifications → Results + DONE/BLOCKED rename → follow-ups), why the numbered
prompt history matters, and where this setup beats or loses to the Claude desktop/mobile
apps. Linked from the README.

A few details in the card didn't match the code, so the doc follows the code:
- The runner is a Node daemon, not a Gemini model. With model **Auto** a cheap **Haiku**
  call picks the model family. Gemini Flash (via aider) is just one tier you can pick
  for simple tasks.
- Machine **Auto** means *whichever runner is free claims it first* (a compare-and-swap
  on the card's `agent_machine`). Nothing picks a machine by how much usage it has left:
  the runner can't ask how much is left and only finds out when the CLI hits the wall.
  If you want usage-aware routing, that's a feature to build.
- 20 s is this setup's `pollSeconds` (the default is 60).

I also added a short note that running friends' consumer subscriptions for your own work
may break Anthropic's usage terms, because that's a real difference from the official apps.

**Files changed**
- created: `doc/how-it-works.md`
- modified: `README.md` (link), `package.json` (0.19.3 → 0.19.4)
- renamed: `082-shortOverviewDocHow-TODO.md` → `-DONE.md`

**Verification**
- `npx prettier --check doc/how-it-works.md` — formatted (per-file).
- Docs only, no code changed, so `npm run check`/tests were not needed.

**Deviations** — Put the doc in `doc/` as markdown, not on the `/workflow` site page. The
page is part of the boilerplate every new project inherits, and this comparison is personal.
