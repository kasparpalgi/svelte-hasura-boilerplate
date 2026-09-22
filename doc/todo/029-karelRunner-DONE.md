> Run with: Sonnet 4.6 / medium
> Machine: karel

# Karel runner

## Original Requirement

[NEVER REMOVE]

Started from board "Karel" task and didn't see it running at my Mac herdr so went to Karel to see herdr and saw it running there and also saw:

Connection

1. Temporary Cloudflare Tunnel Start a foreground relay and temporary URL, then print its QR. An installed background relay is restarted instead of duplicated.

2. Community WebRTC Gateway Check the project's shared gateways, save the healthy candidates, then start or restart the relay and print its QR.

3. Deploy or Upgrade Your Own WebRTC Gateway Copy the gateway shipped by this plugin to your server over SSH, then start or restart the relay and print its QR.

Stable Cloudflare tunnel

4. Stable Tunnel Guided permanent hostname, dedicated tunnel, and background service.

5. Change Tunnel Hostname Move this relay to a different tunnel hostname and reprint the QR.

6. Remove Stable Tunnel Remove this relay's recorded service, tunnel, config, and credentials.

Phone app

7. Choose Phone App and Show QR Keep or change the shared app origin, then reprint the private setup QR.

8. Configure App Deployment Designate this computer as the deployment owner and pin its shared app origin.

Diagnostics

9. Show Full Status Service, health, and a sanitized support snapshot.

q. Exit, change nothing

---

What to pick? Also, in Karel I don't see at the bottom of Claude % of current session and % of week and other stats I see on Mac.

_From Kanban card `8497387b-95aa-4c31-85bd-f1db295eea38`._

_GitHub issue #29 — end the commit subject with `(#29)`._

## Results

**Summary** — Advisory answers to both questions; no code changes needed.

**Question 1 — What to pick from the herdr/relay menu?**

It depends on the goal:

- **Option 1 (Temporary Cloudflare Tunnel)** — best for quick tests or sharing a dev server temporarily. Spins up a foreground relay with a random URL; stops when you quit. Use this first to confirm herdr is working.
- **Option 4 (Stable Tunnel)** — best for a permanent hostname you share with the phone app or collaborators. Sets up a background service that survives reboots. Use this once you confirm everything works via option 1.
- **Option 7 (Choose Phone App and Show QR)** — use after the tunnel is running if you need to point the phone app at a different origin.

If you're just checking that herdr is working on Karel, pick **1**.

**Question 2 — Why no session stats on Karel?**

The `% of current session / % of week` bar at the bottom is the Claude Code **status line**. It is enabled per-machine and may not be configured on Karel. To set it up:

```bash
# on Karel, run:
claude config set statusBar true
```

Or run `/statusline-setup` inside a Claude Code session on Karel — that skill configures the status line interactively. If the terminal on Karel is a plain SSH session without the Claude Code desktop app, the status line may not render; it requires a terminal that supports the ANSI sequences Claude Code uses.

**Files changed** — None (advisory only)

**Verification** — N/A

**Deviations** — Task was a question, not a coding task. Answered in Results.
