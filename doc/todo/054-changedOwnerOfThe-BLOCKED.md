> Run with: Opus 5.5 / high
> Machine: dell

# Changed owner of the repo

## Original Requirement

[NEVER REMOVE]

`tektok-app` was a private account on github so I created `mytekdok` organisation so the repo became `mytekdok/tektok-app` but I can't seem to add that to the TekDok App Kanban board as it doesn't show up there although I am set as admin for that repo.

_From Kanban card `f4f07c43-579d-404e-9e10-5aeb546fd5e9`._

_GitHub issue #54 — end the commit subject with `(#54)`._

## Results

**Summary**

`mytekdok/tektok-app` is missing from the board's repo picker because of a GitHub setting
in the new organisation, not a Kanban bug.

- **Cause: the organisation blocks OAuth Apps by default.** The Kanban connects to GitHub as
  an *OAuth App* (`GITHUB_CLIENT_ID` starts with `Ov23`, scope `repo user read:org`). GitHub
  turns on "OAuth app access restrictions" by default for every new organisation. Until an
  owner approves the app, GitHub leaves that organisation's private repos out of
  `GET /user/repos` for the app's token. Being repo admin doesn't change this. Checked with
  the `gh` CLI, an app GitHub has approved: `mytekdok/tektok-app` is private, you're `admin`
  on it, and it's **#2** in `/user/repos?sort=updated`. So the API has it, but the Kanban's
  token doesn't see it.
- **Second bug, fixed (`svelte-todo-kanban` `6f7031c`, v0.20.2).** The picker only ever
  loaded the first 100 repos. You have 345, so most older repos could never be picked.
  `/api/github/repos` now pages through all of them, up to 1000. It also uses the shared
  `getGithubToken`/`githubRequest` helpers instead of repeating the token code.
- **Hint added in the picker.** It says an organisation's repo stays hidden until the
  organisation approves the app, and links to GitHub → *Authorized OAuth Apps*. Text is in
  en, et and cs.

**What you need to do (why this is BLOCKED).** This takes one click on GitHub as the
`mytekdok` owner, which only you can do:
1. Signed in to GitHub as **`kasparpalgi`** (the account the Kanban is connected with), open
   https://github.com/settings/connections/applications/Ov23lizjkrYzVgk6B3Oz. That's the
   Kanban's OAuth App, which GitHub lists as **ToDzz**, not "Kanban".
2. Under **Organization access**, click **Grant** next to `mytekdok`. You're an org owner,
   so that approves it right away.
   (Or: https://github.com/organizations/mytekdok/settings/oauth_application_policy →
   approve the app, or remove the restrictions.)
3. Reopen the board's "Connect GitHub Repo" dialog. `mytekdok/tektok-app` should now be
   listed. You don't need to reconnect GitHub, because the existing token gets the access.

**Files changed**
- `svelte-todo-kanban`: modified `src/routes/api/github/repos/+server.ts`,
  `src/lib/components/listBoard/GithubRepoSelector.svelte` (hint; the formatter hook also
  reflowed a few long lines), `src/lib/locales/{en,et,cs}/common.json`, `package.json`
  0.20.1 → 0.20.2. Created `src/routes/api/github/__tests__/repos.test.ts`.
- This repo: this file; `package.json` 0.15.6 → 0.15.7.

**Verification**
- Kanban `vitest --project=server`: all 280 tests pass, including 3 new repo-picker tests
  (pages past 100, stops on a short page, 400 without a GitHub connection).
- `npm run check`: 0 errors, 0 warnings. eslint on the changed files: clean.
- Not checked in a browser: the picker needs a signed-in session and a connected GitHub
  token. I didn't use your stored token to confirm the restriction. The diagnosis comes from
  comparing with `gh`, and from the token being an OAuth App token.

**Deviations** — Fixed in `svelte-todo-kanban`, where the board lives, not in this repo. The
fix also covers the 100-repo cap I found while looking into this.

**Follow-up (same day).** You couldn't find "the Kanban app" under Authorized OAuth Apps.
GitHub lists it as **ToDzz**: the login page for client id `Ov23lizjkrYzVgk6B3Oz` reads
"continue to ToDzz". The Kanban's database shows your GitHub connection was made as
`kasparpalgi` on 2026-09-17. The picker hint now names ToDzz (`svelte-todo-kanban`
`6676905`, v0.20.3).

**Follow-up 2: duplicate clones removed (same day).** After the repo was connected, every
machine turned out to have two clones of it. At 13:33–13:45 the runner's onboarding saw a
board on `tektok-app/tektok-app`. The existing clones' origin had already been changed to
`mytekdok/tektok-app`, so `findClone` found no match. Each machine then cloned a second copy
into `~/Documents/GitHub/tektok-app` and added it to `config.json`. On dell, tasks 187 and
188 ran in that copy. Meanwhile the real clone got marked `blocked: dirty` because of two
uncommitted URL edits.
- Kept `~/Documents/GitHub/customers/tektok-app` on **dell, karel and mac**. It has the
  `.env` files, the stashes, and the path karel's CI runner reads `TEKDOK_ENV_FILE` from.
- Dell: committed the two leftover URL edits as `mytekdok/tektok-app@518f6d66` (README
  badge, `doc/Testing.md`), fast-forwarded the clone, and copied over the ignored
  `187`/`188` `.log` files. The `dirty` block cleared on the next tick.
- Checked that each duplicate had no uncommitted work, no stashes and no unpushed commits
  (mac's `eb0cd2c4` is an ancestor of `main`), and that no process was using it. Then
  deleted it on all three machines.
- Removed `tektok-app/tektok-app` from `repos` and `pullRequests` in each machine's runner
  `config.json`. The board now names `mytekdok/tektok-app`, which is mapped, so nothing gets
  re-cloned.
- Left alone: mac's real clone is on branch `todo/189-joinWithoutCamera` with 10 stashes.
  That's the runner's own state, so I didn't touch it.
- Root cause filed for later: `055-runnerRenamedRepoReclone.md` (Backlog).
