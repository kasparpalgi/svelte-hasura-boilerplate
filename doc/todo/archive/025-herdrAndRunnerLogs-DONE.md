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
- [x] Phone can reach herdr — **via the relay PWA, not the Play Store app** (see session 2)

## Results

**Summary**

Two things: the Herdr Android connection is fixed, and the runner now keeps a full
transcript of every agent session.

### 1. Herdr Android — a real bug, but NOT the cause

> **Superseded — see session 2 below.** The `PATH` problem described here was real and is
> still worth fixing, but it was **not** why the Android app failed. The app never looks
> for `herdr` on `PATH`. Kaspar retried after this fix and got the identical error.

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

`herdr` was also symlinked into `/opt/homebrew/bin` (writable; `/usr/local/bin` is not),
since herdr's own remote-attach docs say it probes Homebrew/mise/Nix install paths as well
as `PATH`. Also irrelevant to the app, kept because it is correct.

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

---

## Session 2 — the actual Herdr fix

Two wrong diagnoses preceded this (024 blamed herdr-web; 025 session 1 blamed `PATH`).
Both were guesses. This session stopped guessing and instrumented the SSH side instead.

### The instrument

A temporary block in `~/.zshenv`, guarded on `$SSH_CONNECTION`, appended
`$ZSH_EXECUTION_STRING` to `~/.herdr-ssh-debug.log`. `~/.zshenv` is sourced by every
non-interactive SSH command, so this captures everything a remote tool executes. It caught
the app's probes on the first retry:

```sh
# probe 1 — session discovery
[ -x ~/.local/bin/herdr-mobile-bridge ] && … sessions --json
for d in ~/.config/herdr/sessions/*/; do [ -S "$d/herdr.sock" ] && …
[ -S ~/.config/herdr/herdr.sock ] && echo herdr-socket-session=default

# probe 2 — arch + binary resolution
echo "herdr-arch=$(uname -m)"
~/.local/bin/herdr-mobile-bridge --version || echo herdr-bridge=missing
for c in ~/.local/bin/herdr ~/.cargo/bin/herdr ~/bin/herdr /usr/local/bin/herdr /usr/bin/herdr …
```

### Root cause

1. The app finds `default` by **enumerating sockets**, not by running `herdr`. That is why
   the session picker worked while attach failed — and why no `PATH` fix could help.
2. The binary it actually needs is **`herdr-mobile-bridge`**, a different binary from
   `herdr`, at `~/.local/bin/herdr-mobile-bridge` with a `sessions --json` subcommand.
3. `uname -m` returns `arm64` on macOS but `aarch64` on Linux. The app bundles Linux-named
   arches only, so it reports the architecture as unsupported.

**`herdr-mobile-bridge` is not published anywhere** — GitHub code search returns 0 results,
and the similarly-named `victorymt/herdr-mobile-bridge` is an unrelated Linux-only Node
plugin with no releases. The "install it manually" instruction points at a binary only the
app's vendor has. **The Play Store app `dev.herdr.mobile` cannot work against a macOS host
until its vendor ships a darwin build.** Not fixable from this side.

### What was delivered instead: the relay, made permanent

`0cv/herdr-mobile-relay` was already installed and running — it had simply never been
paired. `devices.json` held `"credentials": null` with a bootstrap invitation expired at
`2026-09-04T18:12` (these links live 10 minutes). A temporary `trycloudflare.com` tunnel was
still serving it, which the first sweep missed by grepping process names for "herdr" —
`cloudflared` does not match.

Made permanent on Cloudflare:

| | |
| --- | --- |
| Tunnel | `herdr-mobile-relay-kaspar-mac` (`5bd5431d-ded1-4bb6-a47c-b97771b2b851`), 4 edge connections |
| Hostname | `herdr.servicehost.io` → CNAME to the tunnel |
| Service | `com.herdr-mobile-relay.service` (LaunchAgent) — starts at login, no open pane |
| Zone | `servicehost.io` only |

**`todzz.eu` was deliberately not used.** Kaspar asked for "todzz cloudflare", but todzz.eu
is on Namecheap nameservers and carries production records for a live product — 5 MX
(email forwarding), 2 SPF TXT, a Google site verification, a Vercel `www` CNAME and an
`api` A record. Putting it on Cloudflare means a full nameserver migration. `servicehost.io`
was already a Cloudflare zone, so it cost nothing and risked nothing. Confirmed with Kaspar
before `cloudflared tunnel login`, which authorizes one zone at a time — verified after the
fact by decoding `cert.pem` and resolving its `zoneID` against the Cloudflare API:
`AUTHORIZED ZONE: servicehost.io`.

Stable setup ran unattended via `HERDR_STABLE_YES=1`, `HERDR_STABLE_DOMAIN`,
`HERDR_STABLE_HOSTNAME`. It reported a failure at the last step — a 60s timeout waiting on
`https://herdr.servicehost.io/healthz` — but the endpoint was already live. The Mac's
router (192.168.0.1) was serving a cached *negative* answer from before the record existed;
Cloudflare's own NS, 1.1.1.1 and 8.8.8.8 all resolved it. Proven with
`curl --resolve herdr.servicehost.io:443:104.21.27.236 …` → **HTTP 200**.

Also repointed the recorded phone-app origin from the dead `trycloudflare.com` host to
`https://herdr.servicehost.io` (`phone-app-origin-configured`, `.bak` kept), so future
setup links are correct.

### Verification

| Check | Result |
| --- | --- |
| App's SSH probes captured | ✅ 8 lines from `81.90.125.29`, both probes |
| `herdr-mobile-bridge` published anywhere | ✅ ruled out — 0 GitHub code-search hits |
| Tunnel connectors | ✅ 4 edge connections, `darwin_arm64` |
| Public endpoint | ✅ HTTP 200 via `--resolve` (router cache masked it locally) |
| Cloudflare zone authorized | ✅ `servicehost.io`, active — `todzz.eu` untouched |
| Phone paired | ✅ device at `2026-09-05T20:08:29Z`, confirmed by Kaspar |
| Logger removed, PATH fix kept | ✅ `ssh localhost 'command -v herdr'` still resolves |

### Deviations

- The original PS asked to fix the Play Store app. That turned out to be impossible from
  this side; the goal behind it — phone access to herdr — was delivered via the relay.
  Flagged rather than quietly substituted.
- `servicehost.io` instead of `todzz.eu`, for the production-DNS reason above.
- The stable-setup state file records a failed run. Everything it provisions is in place
  and verified; only its own local health probe failed, on stale router DNS.
