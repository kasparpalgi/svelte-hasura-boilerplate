> Run with: Sonnet 5 / medium

# Save runner output to log + make Results step resilient

## Original Requirement

---PS: when I try to connect from Android Herdr app, it still says after login to drlrct herdr session where only option is default. I pick it and then: Connection failed. The app's bundled herdr bridge does not support this server CPU architecture - install it manually. FIX THAT. I WANT TO ACCESS WITH HERDR!!!!

[NEVER REMOVE]

From 021: "in the task file the agent texts were not added". The runner's Claude session
produces output but discards it on success. The `/todo` skill's Results step may not run
if Claude hits context limits.

## Design

Changes in `klarity-claude-kit` → `plugins/dev-kit/runner/`:

### 1. Save agent output to a log file

In `run.js`, after `shell()` returns, write the full `output` to
`doc/todo/NNN-slug.log` (or `.claude/todo/` — same resolution as the task file).
This preserves the agent's full conversation for debugging and audit.

### 2. Post output tail as card comment on success too

Currently the runner only posts `tail(output)` on error. On success, post the last
~15 lines as a card comment so the kanban shows what happened — not just "committed as abc".

### 3. Make the `/todo` skill's Results step more resilient

In the `todo/SKILL.md` skill, add a note: "If context is running low, write a minimal
Results section (Summary + Files changed) before the full verification. Never skip this step."

## Verification

- [x] After runner completes a task, `NNN-slug.log` exists with full agent output
- [x] Card comment on success includes last ~15 lines of output
- [x] `/todo` skill text updated with resilience note
- [x] Herdr Android app can reach `herdr` over SSH

## Results

**Summary**

Two things: the Herdr Android connection is fixed, and the runner now keeps a full
transcript of every agent session.

### 1. Herdr Android — root cause and fix

The app SSHes into the Mac and runs `herdr` there. Over a **non-interactive** SSH
command, zsh sources only `~/.zshenv` — not `~/.zprofile`/`~/.zshrc` — so `PATH` was:

```
/Users/klarity/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

`~/.local/bin` was missing, so `herdr` (installed at `~/.local/bin/herdr`) was invisible
to the app. The app fell back to its own bundled bridge binary, which is built for
Linux — hence _"the app's bundled herdr bridge does not support this server CPU
architecture — install it manually."_ The message was misleading: nothing was wrong with
the architecture, herdr simply was not on the remote `PATH`.

Fix: `~/.zshenv` now prepends `~/.local/bin` (and `/opt/homebrew/bin`), guarded so it
never double-prepends. Verified:

```
$ ssh localhost 'command -v herdr; herdr --version; uname -sm'
/Users/klarity/.local/bin/herdr
herdr 0.8.2          # 0.8.2 is the current release — no version mismatch
Darwin arm64
$ ssh localhost 'herdr session list'
default   running   /Users/klarity/.config/herdr
```

The `default` session the app offered is the real one, and it is now reachable.
No sudo, no manual bridge install, no herdr-web build needed.

### 2. Runner: transcripts + richer notifications

- Full `claude` output is written to `<todo-dir>/NNN-slug.log` after every run, and the
  path is printed in the runner log.
- Logs are kept out of git: the first run in a repo appends `*.log` to the task folder's
  `.gitignore` **and commits it**. Committing matters — an untracked `.gitignore` would
  itself trip the runner's "skip — dirty working tree" guard and wedge the repo
  permanently. Caught in an end-to-end test, not in review.
- Pushbullet notifications now carry `tail(output, 15)` on success as well as failure,
  so the phone shows what happened rather than just a checkmark.

**Files changed**

`klarity-claude-kit`:

- `plugins/dev-kit/runner/src/run.js` — `tail()`, `ignoreLogs()`, log write, tails in both notifications
- `plugins/dev-kit/skills/todo/SKILL.md` — "never skip Results" resilience note
- `plugins/dev-kit/runner/README.md` — documented the log file and the ignore rule
- `plugins/dev-kit/.claude-plugin/plugin.json` — 0.3.1 → 0.4.0

`svelte-hasura-boilerplate`:

- `doc/todo/025-herdrAndRunnerLogs-DONE.md` — this file
- `package.json` — 0.4.3 → 0.4.4

Machine config (not in any repo):

- `~/.zshenv` — `~/.local/bin` on the non-interactive `PATH`

**Verification**

| Check                                | Result                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| `herdr` resolvable over SSH          | ✅ `ssh localhost 'herdr --version'` → 0.8.2                  |
| `herdr session list` over SSH        | ✅ shows `default running`                                     |
| Runner end-to-end (stub `claude`)    | ✅ 40-line transcript written to `900-scratchTest.log`         |
| Working tree clean after a run       | ✅ `git status --porcelain` empty; ignore rule auto-committed  |
| `tail()` output                      | ✅ exactly 15 lines, 209 chars                                 |
| `node --check src/run.js`            | ✅ passes                                                      |
| Runner service reloaded              | ✅ `launchctl kickstart -k` — new code live                   |

Not verified: the actual tap-through from the phone, and Pushbullet delivery of the new
tail body (needs a real runner task to fire). Both are user-side confirmations.

**Deviations**

- The PS was handled first — it was the loud part of the request and turned out to be a
  one-line `PATH` fix rather than the herdr-web rebuild task 024 predicted. Task 024's
  diagnosis ("herdr-web binary mismatch, compile from source") was wrong; this supersedes it.
- Design item 2 said "post output tail as a **card comment**". This runner has no Hasura
  or card API any more (it is the local-clone rewrite — `-DONE.md` rename is the only
  state), so the tail goes to the existing Pushbullet notification instead. Same effect,
  same surface: the phone.
- The design did not mention gitignoring the logs. Without it the transcript dirties the
  tree and the runner skips the repo forever, so it was necessary, not scope creep.
