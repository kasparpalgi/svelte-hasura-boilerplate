> Run with: Opus 5 / high

# Multiple servers with Herdr

## Original Requirement

[NEVER REMOVE]

See ../server server "Karel" and I have already installed there Herdr, cloned all the repos in `/plugins/dev-kit/runner/config.json` in `kasparpalgi/klarity-claude-kit` repo and also that repo is there and config file copied. Same folder structure. Also, installed claude code but plugin not installed. Make everything working in that machine and then I shall be able to pick from the Kanban board's card not only what model/effort but also which Machine to run it on "Karel Ubuntu" or "Kaspar Mac".\
\
Even better would be if I could see in the herdr only in this machine also running sessions in that Karel machine so I would not need to have 2 herdrs on my mobile but just the one I already have.

_From Kanban card `443965e1-f1b9-43a5-9d30-5d756c4df5a6`._

_GitHub issue #27 — end the commit subject with `(#27)`._

---

## Results

**Summary** — Karel is a working second runner machine, and the queue can now be
split between it and the Mac without both running the same task.

The design question the card left open was *how* a card names its machine. Answer:
one line in the task file, under the tier line the board already writes.

```
> Run with: Opus 5 / high
> Machine: karel
```

Each runner names itself in `config.json` and takes only the tasks addressed to it.
A file with **no** such line is *unaddressed* — that is every task file ever written
until today — and exactly one machine may claim those (`machineDefault`, the Mac).
Without that rule the whole existing backlog would have double-run the moment Karel
came up. `machine` unset keeps a single-runner install behaving exactly as before,
so nothing else that uses this runner had to change.

`machine` accepts a list of spellings (`["karel", "karel-ubuntu"]`) because the
failure it prevents is silent: a task addressed to a name no runner answers to never
runs and nothing complains. `--check` is where you see that — it prints
`[→ karel, not this machine]` beside every pending task owned elsewhere.

On Karel: the dev-kit plugin installed (the README's marketplace owner was wrong and
is fixed), herdr server and the runner as systemd `--user` units with linger on, the
Pushbullet token in `~/.config/kanban-runner.env`, and the three first-run Claude
Code dialogs pre-answered. Those three were the real work — each one stalls a
headless run at a prompt nobody sees until the task times out, and two of them only
showed up by running the thing for real.

**Files changed**

*`klarity-claude-kit`* (commits `0de0ba2`, `57d21c5`)

- created `plugins/dev-kit/runner/src/machine.js` — the `> Machine:` line, slugging, the filter
- created `plugins/dev-kit/runner/test/machine.test.js` — 8 tests
- modified `src/config.js` (`machine`, `machineDefault`), `src/queue.js` (`machine`
  read with the stat), `src/run.js` (filter before `pick`, machine in `--check`)
- modified `README.md` (new *Which machine runs it* section, config table),
  `config.example.json`, and the marketplace owner in three places
- bumped runner `0.14.2 → 0.15.0`, plugin `0.12.8 → 0.13.0`

*`server`* (commit `5391179`)

- created `Karel/kanban-runner/` — README, `herdr-server.service`, `kanban-runner.service`
- modified `Karel/Karel.md` — runner row in the services table

*this repo*

- created `doc/todo/030-machinePickerOnTheCard.md` — the board half, spec'd against
  the contract the runner now implements
- modified `CLAUDE.md` — marketplace owner
- bumped `0.9.1 → 0.10.0`

*on Karel, not in any repo* — `~/.config/systemd/user/*.service`,
`~/.config/kanban-runner.env` (600), `config.json` (`machine`), `~/.claude.json`
(trust for 11 repos), `~/.claude/settings.json` (bypass + auto prompt skips),
`loginctl enable-linger krl`. *On the Mac* — `~/.ssh/config` gained a `karel` host.

**Verification**

| Check | Result |
| ----- | ------ |
| `npm test` (runner, Mac) | 73 pass, 0 fail — 8 of them new |
| `npm test` (runner, Karel) | 0 fail |
| `--check` on the Mac | `machine: mac,kaspar-mac + unaddressed` |
| `--check` on Karel | `machine: karel,karel-ubuntu`; 027 shown as `[→ unaddressed, not this machine]` — routing correct against a real queue |
| End-to-end on Karel | throwaway repo, `> Machine: karel`, Haiku: herdr pane → Claude → `hello.txt` written → `-DONE` rename → commit → push. Green on the third attempt; the first two caught the trust and bypass dialogs, which is exactly what it was for |
| Services | `herdr-server` and `kanban-runner` both `active`, runner idle by design (nothing addresses Karel yet) |
| Repo hygiene on Karel | all 10 clones were dirty with `npm install` lockfile churn, which would have blocked every one of them; discarded |

**Deviations**

- **Split, not finished in one pass.** The card asks for three things. The runner
  half is done and verified; the board half is `030-machinePickerOnTheCard.md`
  (different repo, its own migration + UI + codegen); the phone half needs a human.
- **The phone: one step left, and it needs you.** The "only one herdr on my mobile"
  ask is already how the relay works — each computer runs its own relay and the app
  merges them, so there is no second app. Karel's relay plugin is installed; what
  remains is the wizard, which ends in a QR code that has to be scanned, so it
  cannot be scripted. From the Mac:

  ```bash
  herdr --remote karel
  herdr plugin pane open --plugin herdr-mobile-relay.events \
    --entrypoint setup --placement zoomed --focus
  ```

  Choose **Community WebRTC Gateway** — no Cloudflare account, domain or
  `cloudflared`, unlike the Mac's `herdr.servicehost.io` tunnel; Karel needs no
  stable hostname. Scan with the phone already paired to the Mac and it adds Karel
  alongside it. Full detail in `server/Karel/kanban-runner/README.md`.
- **The Mac daemon has to be restarted** to load the new code —
  `launchctl kickstart -k gui/$(id -u)/eu.todzz.kanban-runner`. Done as the last
  step of this run, which costs this session its `claude_usage` row: the daemon that
  would have written it is the one being replaced.
- **Karel's clone set is the Mac's.** `config.json` was copied over as-is and all ten
  paths resolve, so both machines can run anything. Nothing was narrowed.
