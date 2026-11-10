> Run with: Opus 5.5 / xhigh
> Machine: karel

# see 082

## Original Requirement

[NEVER REMOVE]

<https://github.com/kasparpalgi/svelte-hasura-boilerplate/blob/main/doc/how-it-works.md> see where claude native apps win and itegrate to run also it in claude apps? what else could be improved implement

_From Kanban card `0e34a099-4a88-47b8-babe-8f29083c7daa`, moved to the agent list._

_GitHub issue #85 — end the commit subject with `(#85)`._

---

## Plan

Too big for one session, so: build the cheapest real integration with the Claude apps
now, and split the other improvements in `doc/how-it-works.md` into Backlog follow-ups.

1. Runner (`klarity-claude-kit/plugins/dev-kit/runner`): an opt-in `remoteControl` config
   key that starts the herdr pane as `claude --remote-control <repo>-<NNN-slug>`, so the
   run also shows in claude.ai/code and the Claude app. Put the session link on the card.
2. Check the real CLI (2.1.322) in a real herdr pane for any first-run dialog.
3. Turn it on for this machine if its account is the user's own.
4. Update `doc/how-it-works.md`; write follow-ups 086–091.
5. Verify: runner `npm test`, a live herdr + Claude run, `prettier --check` on markdown.

## Results

**Summary**

Where the apps win and what to do about it was already written up in 082, so this run
builds the first integration and files the rest.

- **Built: the runner's sessions now open in the Claude app.** With `"remoteControl": true`
  in a runner's `config.json`, the herdr pane starts as
  `claude --remote-control svelte-hasura-boilerplate-085-see082`. The run then also shows
  in claude.ai/code and the Claude app (Code tab), with diffs and a chat UI, and you can
  type to it there. The runner reads the `https://claude.ai/code/session_…` link the CLI
  prints and appends it to the card's live status line, which keeps it through the finish.
  The Kanban already linkifies comments, so it's one tap from the card. herdr, Pushbullet
  and the `-p` fallback are unchanged. Remote Control needs a TTY, so `-p` runs don't get it.
- **On for Karel.** `claude auth status` on Karel shows your own account, not a friend's,
  so I set `"remoteControl": true` in Karel's `config.json`. That file is gitignored and
  reloaded every tick, so the next Karel run uses it once the runner restarts on the new
  code. It's also in `config.example.json`, which is the Mac's config.
- **Checked on the real CLI.** The `--remote-control` flag connects with no "Enable Remote
  Control?" question (`remoteDialogSeen` stayed unset), so I dropped the consent pre-seed
  I'd started writing.
- **Follow-ups (Backlog, suffixless):** 086 Cloud as a machine (`claude --cloud`),
  087 runner health on the board (with stale-runner refusal), 088 one setup script per
  machine, 089 runner smoke test, 090 readable transcript on the card for machines on
  friends' accounts, 091 every task in a worktree.

**Files changed**

- `klarity-claude-kit` (commit `06278fa`):
  - modified: `runner/src/config.js` (`remoteControl`, default false),
    `runner/src/run.js` (flag + `onRemote` → status line), `runner/src/herdr.js`
    (`remoteUrl` read once the agent is up), `runner/src/status.js` (link kept on every
    later line), `runner/src/queue.js` (`sessionName`), `runner/README.md`,
    `runner/config.example.json`
  - tests: `test/herdr.test.js` (+2), `test/status.test.js` (+1), `test/queue.test.js` (+1)
  - local only, gitignored: Karel's `runner/config.json` → `"remoteControl": true`
- this repo:
  - created: `doc/todo/086-cloudAsMachine.md`, `087-runnerHealthOnBoard.md`,
    `088-setupMachineScript.md`, `089-runnerSmokeTest.md`, `090-transcriptOnCard.md`,
    `091-alwaysWorktree.md`
  - modified: `doc/how-it-works.md` (what's built, Karel's account, follow-up numbers),
    `package.json` (0.19.5 → 0.19.6)
  - renamed: `085-see082-TODO.md` → `085-see082-DONE.md`

**Verification**

- Runner `npm test`: 212/212 pass, including the 4 new tests.
- Live run on Karel: a Haiku session in a real herdr pane, started with the runner's own
  flags plus `--remote-control`. No dialog, `/rc active` in the header, `onRemote` got the
  `claude.ai/code/session_…` link, a prompt round trip reached `done`, and `runInHerdr`
  returned `code 0, started true`. Probe tabs closed afterwards.
- `npx prettier --check` on `doc/how-it-works.md` and the six follow-ups: clean.
- No app code changed in this repo, so `npm run check` and the app tests weren't needed.

**Deviations**

- No consent pre-seed: the live check showed the flag doesn't ask.
- The 082 doc said Karel runs on a friend's account. It's on yours, so the doc now says
  so. Dell's and Windows' accounts weren't checked; Remote Control stays off there.
- The probes left up to three offline sessions named `…rcprobe-085` / `…085-rcprobe` in
  your claude.ai/code list. You can archive them.
- To also get the Claude app's own push notifications, run `/config` once on Karel (and
  the Mac) and turn on _Push when actions required_. That's a per-account choice, so I
  didn't change it.
