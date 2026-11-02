# 063 — See and steer the Windows runner from other machines

## Original prompt

```
PS C:\Users\kaspa> herdr
herdr : The term 'herdr' is not recognized as the name of a cmdlet, function, script file, or operable program. Check
the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:1 char:1
+ herdr
+ ~~~~~
    + CategoryInfo          : ObjectNotFound: (herdr:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
```

- created task on kanban board on tekdok-landing and moved to TODO list and wanted to see if work - okay not seen on mobile as relay not added via link there but also no herdr on win? how can I see and interacti with runner on win from other machines as i do with other runner machines

## Results

### Summary

The tekdok-landing card ran on the Windows runner: WSL picked up `038-estonianCopyRewrite-TODO.md`
at 00:05 (Opus 5.5 / high) and it is working in herdr tab `task-038`. It was missing from the phone
and from herdr on Windows because herdr only ran inside WSL and WSL had no phone relay. Both are
fixed:

- **Phone:** WSL now runs `herdr-mobile-relay` behind the stable Cloudflare tunnel
  `relay-karel2.servicehost.io`, using the same app origin (`https://herdr.servicehost.io`) as Mac,
  Dell and Karel. What's left is pairing the phone with a setup link, which only the user can do.
- **This PC:** native herdr 0.9.5 is installed for `kaspa`, with saved machines Karel Windows
  (`winwsl`), Dell and Karel, all `reachable`. `ssh winwsl` works directly from PowerShell.
- **Dell / Karel:** `herdr --remote winwsl` attaches (checked from Dell: it shows the
  `karel2: runner` workspace with `task-038`).

### Changes

- WSL: plugin `0cv/herdr-mobile-relay`, `cloudflared`, user service `herdr-mobile-relay`, tunnel
  `herdr-mobile-relay-karel2` + CNAME, `~/.cloudflared/cert.pem` (copied from Dell), and
  `kaspa@karel2`'s key in `~/.ssh/authorized_keys`.
- This PC: `~\.herdr` (herdr 0.9.5, user PATH), and `Host winwsl` → `127.0.0.1:9113` in `~/.ssh/config`.
- `server/Windows/Windows.md`: "Watching and steering the runner".

### Verification

- `systemctl --user is-active herdr-mobile-relay` → `active`. `https://relay-karel2.servicehost.io/readyz` → 200.
- `herdr machine status` on this PC: Karel Windows, Dell and Karel are all `reachable`.
- Attaching from Dell (`herdr --remote winwsl`) rendered the runner workspace.

### Notes

- **The Mac's herdr is 0.8.2**, older than the 0.9.1 servers on Dell, Karel and WSL.
  `herdr --remote winwsl` from the Mac offers to install 0.8.2 there and stop the remote server.
  Answering yes kills running tasks. Update the Mac's herdr while its runner is idle.
- The relay wizard failed the first time: the router had negative-cached the brand-new CNAME
  (30-minute TTL). A temporary `/etc/hosts` line got the rerun through, and the line was then
  removed. Until about 00:45 on 2026-11-02, home Wi-Fi may not resolve `relay-karel2`; mobile
  data will.
- Installing the plugin opened its setup-menu pane inside the runner's herdr session. That pane
  was closed.
