# Add Windows to Kanban

## Original Requirement

[NEVER REMOVE]

See ../server for info about the new Windows machine

See ../klarity-claude-kit to see how the runner works

See ../svelte-todo-kanban to see how I move card to TODO list and pick model and machine and then it runs 

First make sure that the new Windows machine has all the wrappers cloned and when.env is updated in Mac then it will be syncing like it syncs now to other machines also to that Windows machine and then obviously add it to the drop down menu so that you can pick that machine and make sure everything works tested, see it works, confirm and if everything is super good you can finish your session

karelsaega1992@gmail.com shall have in dropdown only that machine

Eg. also /todo 061 didn't work here

_From Kanban card `6ea3024c-cb1b-44e4-a9d5-c4e486e6a345`._

_GitHub issue #61 — end the commit subject with `(#61)`._

## Results

**Summary** — The Windows PC (`karel2`) now works as a fourth Kanban runner, like Dell, and you can pick it on a card.

- **Repos:** the WSL runner (`win@karel2`, machine `windows` / `win` / `karel2`) now has a clone, with dependencies installed, of every repo the Mac and Dell watch. 15 boards came in with `npm run onboard -- --no-peers`. `kusp`, `krobe-eshop` and `raamatu-aasta` have no board, so I cloned them by hand. I removed `onboardMinutes: 0`, so the 5-minute sweep adopts new boards. It has already adopted `ostutark_v2` on its own, which was connected during this run. `config.json` now lists 21 repos. pnpm is in place for `kirjanduse-selts`.
- **`.env` sync:** the Mac already had `winwsl` in `peers`. Its sweep pushed the `.env` files for the new clones at 19:02, and `npm run sync-secrets` sent the last two. A `--dry-run` now reports karel, dell and winwsl all `in sync`. From now on, a `.env` edited on the Mac reaches Windows on the next sweep.
- **Kanban dropdown** (svelte-todo-kanban `ec19edc` and `3885762`, version 0.21.0, deployed on Vercel):
  - The machine dropdown has a new option, **Karel Windows** (`windows`).
  - karelsaega1992@gmail.com sees only that option, with no Auto.
  - When he publishes a task, the `write-draft-file`, `write-task-file` and `update-task-file` endpoints always write `> Machine: windows`. This is set in `src/lib/utils/agentMachine.ts`.
  - Migration `1807000000000_add_windows_to_agent_machine` allows `windows` in `todos_agent_machine_check`. It is applied on the live Hasura. Before it, the WSL runner failed every time it tried to claim a card: `cannot claim 429-flakyE2eChatInterview-TODO.md: Check constraint violation`.
- **`/todo` on this PC:** Claude Code on Windows (user `kaspa`) had no plugins installed. I installed `dev-kit@klarity` at user scope, and a headless session now lists `/plan`, `/todo` and `/verify`.
- **Docs:** server `d4cab25` updates the WSL runner section of `Windows/Windows.md` and corrects the memory setting there to 6 GB, which is what `.wslconfig` actually sets. klarity-claude-kit `c2ca5aa` adds Windows to the runner README's machine and peer lists.

**Files changed**

- svelte-todo-kanban:
  - new `src/lib/utils/agentMachine.ts` and its test
  - migration `1807000000000`
  - `CardDetailView.svelte`, `cardHelpers.ts`, `types/todo.ts`
  - the `en`, `et` and `cs` locales
  - the three `api/github/*-file` endpoints
  - `taskfile.test.ts`, `package.json`
- server: `Windows/Windows.md`.
- klarity-claude-kit: `plugins/dev-kit/runner/README.md`.
- This repo: this file and `062-windowsRunnerSmokeTest-DONE.md`.
- Outside the repos: the WSL runner's `config.json` (the old one is saved as `~/config.json.bak-061`), the clones in WSL, and the plugin install for `kaspa`.

**Verification**

- **Kanban:**
  - `npm run check` gives 0 errors and 0 warnings. I ran it on the Mac, in a temporary worktree with the real `.env`.
  - The vitest `server` project passes 288/288 with the real `.env`.
  - Full vitest on this PC passes 347/349. The 2 failures need `$env` values this clone doesn't have (`PUBLIC_API_ENDPOINT` → `Invalid URL`), and the one that runs in the server project passes with the real `.env`.
  - svelte-autofixer is clean.
  - Vercel reports success, and the live bundle on www.todzz.eu contains `"Karel Windows"`, `["mac","karel","dell","windows"]` and the pin map.
- **End to end:**
  1. Card `76093f4f-75a2-471a-9ea7-c8ba0be35e91`, "Windows runner smoke test", set to Haiku 4.5 / low on machine `windows`, became `062-windowsRunnerSmokeTest-TODO.md`.
  2. The WSL runner picked it up at 19:10 and ran it on `karel2` (`Linux 6.18.54.1-microsoft-standard-WSL2`).
  3. The file was renamed `-DONE` and pushed in `447a58b`.
  4. The card is in Review with its results posted, and a `claude_usage` row records $0.072.
- **WSL `--check`:** 18 boards are connected and all onboarded, 21 repos are watched, and nothing is dirty or blocked. Every pending task is addressed to another machine.

**Deviations and notes**

- **How the test was run:** I wrote the smoke-test card and its task file through Hasura admin and git, copying what `write-task-file` produces. The endpoint needs a signed-in session with your GitHub token. I checked Karel's dropdown with unit tests and in the deployed bundle. I did not click through it, because I can't sign in as Karel.
- **Karel's board:** Karel's own board (`karelsaega1992s-board`) has no GitHub repo connected yet. Until he connects one, his cards can't reach any runner.
- **Auto cards:** like Dell, Windows now also claims Auto cards when it is the first free runner. Its Claude login is kaspar.lemmo@gmail.com on the Pro plan, so any Auto work it takes is billed to that account and hits Pro's limits sooner.
- **Prompt stall:** attempt 1 of 062 failed with herdr `agent_prompt_stalled`. The runner resends the prompt once, and that stalled too. Attempt 2 ran cleanly. The same error appears 6 times in the Mac's log and twice in Dell's, so it is not specific to Windows.
- **Disk:** C: now has 28 GB free, because the WSL disk grew with the new clones and their `node_modules`.
- **Version:** this repo's `package.json` is not bumped, because no code changed here.
