> Run with: Opus 5.5 / medium
> Machine: mac

# Servo runner

## Original Requirement

[NEVER REMOVE]

I turned "servo Dell" runner off recently. Turn it back on and let me know how to turn on/off manually runners.

Also, remember that if followup todo tasks are created then they shall not be auto run so file name not TODO ending as I want manually confirm what model, effort and runner and make sure it is created in Kanban board in a way it is connected to GitHub issue the same way when I manually create a new task in Kanban borad.

_From Kanban card `b7806b3b-d0ef-46f1-864d-c95a4ce01800`, moved to the agent list._

_GitHub issue #58 — end the commit subject with `(#58)`._

## Results

**Summary**

- **Dell (servo) runner is back on.** It had been stopped *and disabled* on Oct 18 16:15.
  Ran `systemctl --user enable --now kanban-runner` on `ssh dell`. It's active now ("watching
  19 repo(s) every 20s"), and because linger is on, it starts again after a reboot.
  The tektok 323 task it was working on when it stopped has since been finished as `-DONE`,
  so nothing was left hanging.
- **Turning runners on and off by hand:**

  | Runner | Off | On | Status / log |
  | --- | --- | --- | --- |
  | Dell (`ssh dell`, Linux) | `systemctl --user disable --now kanban-runner` | `systemctl --user enable --now kanban-runner` | `systemctl --user status kanban-runner` · `journalctl --user -u kanban-runner -f` |
  | Karel (`ssh karel`, Linux) | same as Dell | same as Dell | same as Dell |
  | Mac (launchd) | `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/eu.todzz.kanban-runner.plist` | `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/eu.todzz.kanban-runner.plist` | `launchctl print gui/$(id -u)/eu.todzz.kanban-runner` · `tail -f ~/Library/Logs/kanban-runner.log` |

  Use `stop`/`start` instead of `disable --now`/`enable --now` for a temporary pause that
  ends at the next reboot. On the Mac, `kill` won't work because `KeepAlive` brings it
  straight back; `launchctl kickstart -k …` restarts it. Tasks that are already running in
  a herdr pane keep going after the runner stops.
- **Karel's runner is off too.** It's enabled but has been inactive since Oct 17 14:43.
  I left it alone because the request only covered Dell. To turn it on:
  `ssh karel 'systemctl --user start kanban-runner'`.
- **Follow-ups never run on their own.** The runner already handles this
  (`runner/src/followup.js`): a suffixless `NNN-slug.md` gets a GitHub issue first, then a
  Kanban Backlog card linked to that issue, the same way a card you create by hand does.
  The file is also renumbered to match the issue. You pick the model, effort and runner
  when you move the card. A `-TODO.md` file is the only kind that runs automatically.
  The gap was in the skill: this Mac's user-scope dev-kit was still **0.2.1**, and its
  `/todo` skill didn't include the "follow-ups are suffixless" rule. **Updated dev-kit to
  0.20.0 on all three machines** (Mac user + project scope, Dell, Karel), and the current
  skill does include the rule.

**Files changed** — this task file only. Changes on the machines: Dell's systemd unit
enabled and started; dev-kit plugin updated on Mac, Dell and Karel.

**Verification** — Dell `is-active` = active, `is-enabled` = enabled, journal shows the
watch loop, Linger=yes. Mac runner `state = running`. `claude plugin update` reported 0.20.0
on every box. No app code changed, so `npm run check` and `npm test` don't apply.

**Deviations** — The plugin update wasn't in the request, but it is what makes "follow-ups
don't auto-run" hold for runs started from this Mac.
