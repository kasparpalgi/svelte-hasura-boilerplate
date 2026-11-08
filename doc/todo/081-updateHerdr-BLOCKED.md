> Run with: Opus 5.5 / medium
> Machine: dell

# Update herdr

## Original Requirement

[NEVER REMOVE]

Phone app version 0.20.7

Version 0.24.0 is released, but this app origin still serves 0.20.7.

This is a separately hosted app. Configure one relay as its deployment owner:

herdr plugin action invoke configure-app-deploy --plugin herdr-mobile-relay.events

Check for Updates

Update Herdr

Relay-hosted apps update with their relay. A separately hosted Pages app can be deployed only by its configured owner relay.

_From Kanban card `b7a24126-b2a3-4d9a-89d4-69244fa9c437`, moved to the agent list._

_GitHub issue #81 — end the commit subject with `(#81)`._

## Results

**Summary** — Investigated on this machine. Nothing in this repo is involved; this is the
herdr-mobile-relay plugin's own setup. Findings:

- Relay installed: **0.22.4** (`~/.local/share/herdr-mobile-relay/current`), plugin repo at
  `968b1d1` ("withdraw v0.22.5 and restore v0.22.4"). `update-state.json` says
  **0.24.0 is available**, `can_install: true`.
- Phone app origin `https://herdr.servicehost.io` is a separately hosted Cloudflare Pages
  app still serving 0.20.7. No relay is its deploy owner yet: `relay.env` has no
  `HERDR_APP_DEPLOY_ORIGIN` / `HERDR_CLOUDFLARE_PAGES_PROJECT`.
- `configure-app-deploy` (`relay/configure-app-deploy.sh`) needs Cloudflare access to list
  Pages projects: either `npx wrangler login` (browser OAuth) or `CLOUDFLARE_API_TOKEN` +
  `CLOUDFLARE_ACCOUNT_ID` in `relay.env`. Neither exists here (no `~/.config/.wrangler/config`,
  no token in `relay.env`), so it cannot run unattended. It also has interactive prompts
  (origin, project, "deploy now?") and restarts the relay service.

**What a human has to do** (in a terminal on dell):

1. Phone → Settings → **Update Herdr** (or Check for Updates) to move the relay 0.22.4 → 0.24.0
   first, so the app bundle you deploy is 0.24.0.
2. `npx wrangler login` (or put a Pages:Edit `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
   in `~/.config/herdr/plugins/config/herdr-mobile-relay.events/relay.env`).
3. `herdr plugin action invoke configure-app-deploy --plugin herdr-mobile-relay.events` —
   accept origin `https://herdr.servicehost.io`, pick the Pages project serving it, answer
   **Y** to "Deploy app version … now?".
4. Reopen the PWA; later app releases deploy from Settings on the phone.

**Files changed** — this task file only (+ `package.json` patch bump).
**Verification** — read-only checks of herdr config/state; no code changed, so no app checks run.
**Deviations** — Did not run the update or the deploy: both need Cloudflare credentials / phone
confirmation that only the owner can give.
