> Run with: Opus 5.5 / xhigh
> Machine: karel

# "Cloud" as a machine: run a card in a Claude Code cloud session

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# "Cloud" as a machine: run a card in a Claude Code cloud session

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

#85 made runner panes show in the Claude app via Remote Control. The next step is to let a card run with no machine of ours at all: add **Cloud** to the card's machine dropdown (todzz.eu, `svelte-todo-kanban`). A runner on the user's own account (Karel or the Mac) sees `> Machine: cloud` and starts `claude --cloud "/todo NNN"` instead of a local pane, then watches the task file on origin as usual.

What has to be true first, per `doc/how-it-works.md` → *Cloud session limits*:

- `/todo` and `/verify` must load in the cloud. User plugins don't, so the skills have to be in the repo's `.claude/skills/` or enabled on claude.ai. Decide which.
- A cloud session pushes a branch, so a cloud task finishes as a PR (reuse `pr.js`).
- No Hasura or home network in the VM: only repos whose checks run without them qualify.

Acceptance: a test card set to Cloud on this repo ends as a PR with a `-DONE.md`, and the card links the cloud session.

*GitHub issue #86 — end the commit subject with* `(#86)`*.*

_From Kanban card `5ed2910e-a02a-464e-847b-30034426cf63`, moved to the agent list._

_GitHub issue #86 — end the commit subject with `(#86)`._

---

## Plan

The open question was how `/todo` loads in a cloud session. My answer is neither of the
two offered options: **the runner puts the skill text into the session's first message**.
A copy in each repo's `.claude/skills/todo` would shadow dev-kit's `/todo` in every local
run and drift from the kit on every bump, which is the bug #92 found in svelte-todo-kanban.
A skill enabled on claude.ai needs a manual upload after every kit bump. Inlining it means
the session follows the runner's own copy and needs no setup.

1. Runner (`klarity-claude-kit`): `"cloud": true` in one runner's `config.json`. A new
   `src/cloud.js` sends each `> Machine: cloud` task to `claude --cloud` (it needs a TTY,
   so it runs under `script`), and puts the `claude.ai/code/session_…` link on the card.
   The runner then goes back to its queue. The session pushes `todo/<stem>`. Once that
   branch holds the `-DONE`/`-BLOCKED` rename, a later tick opens the PR (`pr.js` finds
   it as before). The merge lands the rename, and `reconcileCards` moves the card. No
   local runner ever runs a cloud task.
2. Kanban (`svelte-todo-kanban`): add `cloud` to `AGENT_MACHINES`, the labels, and a
   migration for the `todos_agent_machine_check` constraint.
3. Acceptance: a test card set to Cloud on this repo, dispatched by the new code, ends
   as a PR with `-DONE.md`, and the card's status line links the session.
4. Docs: `runner/README.md`, `doc/how-it-works.md`.

## Results

**Summary**

**Cloud** is now a machine on the card, and it works end to end. The test card ended as
a PR with a `-DONE.md`, and the card links the cloud session.

- **Decision: inline the skills, not copy or upload them.** Plugins don't load in a cloud
  session (the docs say repo `enabledPlugins` are skipped too). The runner puts its own
  copy of the `todo` and `verify` skills into the session's first message, plus three
  cloud rules: work on `todo/<stem>`, push it, open no PR. A copy in `.claude/skills/`
  would shadow dev-kit's `/todo` in every local run and drift on each kit bump (the bug
  #92 fixed in svelte-todo-kanban). A claude.ai upload would need a person after each bump.
- **Runner (`klarity-claude-kit` `4129327`, runner 0.32.0).** `"cloud": true` in one
  runner's config. Each tick, `src/cloudTick.js` handles that runner's `> Machine: cloud`
  tasks:
  1. It starts `claude --cloud "<prompt>" --model … --effort …` under `script`, because
     the CLI refuses to start without a terminal.
  2. It puts the session link on the card and goes back to its queue without waiting.
  3. Once `origin/todo/<stem>` holds the rename, it opens the PR with `gh` (`pr.js`
     `prs`/`prOf` find it after that).
  4. The merge lands the rename, and `reconcileCards` moves the card.

  No runner ever runs a cloud task locally, not even one with no `machine` set. A task is
  sent once per version of its file, and a start that fails twice isn't retried. Turned
  on for **Karel**, which `claude auth status` shows is your own Pro account. It's on
  Karel only, because two runners would both send the task.

- **Kanban (`svelte-todo-kanban` `b980140`, 0.26.0).** `cloud` added to `AGENT_MACHINES`
  as "Cloud (Claude Code)" / "Pilv (Claude Code)", with a test. Migration
  `1809000000000_add_cloud_to_agent_machine` is applied on the live Hasura: the constraint
  now lists `'cloud'`.
- **Acceptance, live.** Test card `82d00a35…` (issue #93, `> Machine: cloud`,
  Sonnet 5.5 / low) went through the new code:
  - **Tick 1:** started `session_01RBXHAWpfhJtkMmuNfX55Jg` in about 3 s. The card read
    `▶ Running on cloud since 23:01 · … · https://claude.ai/code/session_…`.
  - **The session:** followed the inlined `/todo` within 3 minutes. It wrote Results,
    renamed the file to `-DONE.md`, pushed `todo/93-cloudSmoke` and opened no PR.
  - **Tick 2:** opened PR #94 (ready, `Closes #93`, session link in the body). The card
    now reads `■ Finished on cloud 23:01–23:04 · Sonnet 5.5 / low · attempt 1 · PR #94 … ·
https://claude.ai/code/session_…`.
  - **Tick 3:** did nothing.
- **What the VM ran in this repo** (from #93's Results): `npm ci` passes. `npm run check`
  fails because the clone has no `.env`. The server unit tests pass. The browser tests
  fail because Playwright's headless shell isn't installed. So this repo qualifies for
  doc and runner work today, and fully once follow-up 095 is done.

**What's left for you**

1. **Merge PR #94** (it only adds the test's `-DONE.md`). The merge moves card #93 to
   Review with its Results and closes the issue. Leave it open if you'd rather keep the
   example.
2. The Mac is on your account too. Leave `cloud` off there: one runner must send cloud
   tasks, and Karel does.

**Files changed**

- `klarity-claude-kit`: created `runner/src/cloud.js`, `runner/src/cloudTick.js`,
  `runner/test/cloud.test.js`. Modified `runner/src/{run,machine,state,status,config}.js`,
  `runner/README.md` (Config table, _Cloud — no machine at all_), `runner/config.example.json`
  and `runner/package.json`. Karel's gitignored `runner/config.json` has `"cloud": true`.
- `svelte-todo-kanban`: modified `src/lib/utils/agentMachine.ts` and its test, the
  `en`/`et`/`cs` `common.json` files and `package.json`. Created the migration `1809…`.
- This repo: modified `doc/how-it-works.md` (_Combining the two_ item 2 is built,
  _Cloud session limits_ has what the CLI and VM really do) and `package.json`
  (0.19.9 → 0.19.10). Created the follow-up `doc/todo/095-cloudSetupScript.md` (Backlog)
  and renamed this file to `-DONE.md`. Issue #93 and `doc/todo/93-cloudSmoke-TODO.md`
  are the test card.

**Verification**

- Runner `npm test`: 231/231 pass, including the 5 new cloud tests. They use a fake
  `claude` that, like the real one, refuses to run without a TTY, plus a fake `gh` and a
  scratch origin, and cover sending, waiting, a WIP push that doesn't count, opening the
  PR, and announcing it once.
- `claude plugin validate ./plugins/dev-kit`: passed.
- Kanban `npm run check`: 0 errors, 0 warnings. vitest: 418/418 pass. Playwright e2e
  wasn't run: only a constant and labels changed.
- Live: the test card ran start to finish as shown above. The DB constraint was read
  back after the migration.
- `prettier --check` on the new and changed runner files and docs: clean. The kit
  README and the Kanban locale files were already off-format before this change, so I
  didn't reformat them.

**Deviations**

- The skills are inlined in the prompt, not taken from `.claude/skills/` or claude.ai
  (see the decision above).
- The runner opens the PR, not the session. A PR the session opens itself still counts.
- A probe left one `todo/086-cloudprobe` branch, which I deleted. It also left two probe
  sessions ("Runner task 086 probe") in your claude.ai/code list, which you can archive.
- Migration 1809 went in through `run_sql`, like 1807 and 1808. None of the three is in
  the Hasura CLI's migration state, so don't run `hasura migrate apply` blind: it would
  re-run 1807, which drops `'cloud'` again.
- Karel's own runner picks up the new code when it restarts after this run.
