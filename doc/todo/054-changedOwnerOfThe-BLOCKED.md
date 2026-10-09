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
1. Open https://github.com/settings/applications → **Authorized OAuth Apps**, and pick the
   Kanban app.
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
