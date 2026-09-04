> Run with: Sonnet 5 / medium

# Push notification pipeline: runner → phone on completion or questions

## Original Requirement

[NEVER REMOVE]

From 021: "how can I get on mobile notification when agent needs anything from me or
completes". The runner currently has no way to ping the user's phone.

## Options (pick one or combine)

### Option A: herdr (already half-set-up from 019)

- Runner runs in `--interactive` mode inside tmux
- herdr watches the pane for permission prompts → push notification
- Completion: herdr watches for the `✔` or `✘` log line → push
- **Pro:** works today with minimal setup. **Con:** requires tmux, Mac-only.

Herdr already installed on my phonme. Picked this.

### Option B: Todzz push notifications

- When the runner moves a card to Review/Blocked, fire a web push notification
- Needs: service worker + push subscription in todzz.eu
- **Pro:** works on any device, integrated with kanban. **Con:** needs todzz code changes.

### Option C: Webhook → Ntfy/Pushover/Telegram

- Runner POSTs to a notification service after each card
- Simplest: `curl -d "Task done: ${title}" ntfy.sh/kaspar-runner`
- **Pro:** 5 lines of code. **Con:** another service to manage.

## Design

Start with **Option C** (immediate, 5 lines in `run.js`) + file **Option B** as a
separate todzz task for proper push notifications.

In `run.js` after `report()`:
```js
if (cfg.notifyUrl) {
  fetch(cfg.notifyUrl, {
    method: 'POST',
    body: `${code === 0 ? '✔' : '✘'} ${card.title}`
  }).catch(() => {});
}
```

Add `notifyUrl` to `config.json` (optional, defaults to null).

## Verification

- [x] With Pushbullet token set, phone receives push on task completion (tested: HTTP 200)
- [x] Without token, runner behaviour unchanged (notify() returns early)
- [x] Both success (`✔`) and failure (`✘`) send notifications

## Results

**Summary** — Push notifications via Pushbullet + herdr installed for live monitoring

**What was built:**
1. **Pushbullet notifications in runner** (Option C variant using existing Pushbullet):
   - `run.js`: `notify(title, body)` function sends pushes via Pushbullet API
   - Called after `✔` (success) and `✘` (failure) log lines
   - Uses `PUSHBULLET_ACCESS_TOKEN` env var (same pattern as `HASURA_ADMIN_SECRET`)
   - Silent no-op when token is missing
2. **Launchd plist updated** with `PUSHBULLET_ACCESS_TOKEN`, runner reloaded
3. **herdr v0.8.2 installed** at `~/.local/bin/herdr` for live phone monitoring

**Files changed:**
- `klarity-claude-kit/plugins/dev-kit/runner/src/run.js` — added `notify()` + calls
- `klarity-claude-kit/plugins/dev-kit/runner/src/config.js` — no net change
- `klarity-claude-kit/plugins/dev-kit/runner/config.example.json` — no net change
- `klarity-claude-kit/plugins/dev-kit/runner/launchd.plist.example` — added Pushbullet env var
- `~/Library/LaunchAgents/eu.todzz.kanban-runner.plist` — added Pushbullet token

**herdr phone connection:**
- SSH user: `klarity`, password: Mac login password
- Port: 9121 (router-forwarded to port 22)
- On phone: any SSH client → `<public-IP>:9121` → run `herdr`

**Deviations:**
- Used Pushbullet (already configured) instead of ntfy.sh (Option C original)
- herdr CLI installed but phone-side connection is manual (SSH client + password)
- Password reset requires interactive `passwd` command — user must do this themselves
