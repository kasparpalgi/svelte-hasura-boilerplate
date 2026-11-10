> Run with: Sonnet 5.5 / medium

# One idempotent setup script per runner machine

## Original Requirement

[NEVER REMOVE]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

Every new machine was its own task (029, 043–045, 058, 061, 066). Write
`runner/scripts/setup-machine.sh` in `klarity-claude-kit` that installs or checks: node,
`claude` + login, the dev-kit plugin, herdr, the systemd/launchd unit, `config.json`
from the example (machine name asked once), and ends with `npm run check`. Running it a
second time changes nothing. Linux and macOS; WSL counts as Linux.

Acceptance: on a machine that is already set up, the script reports every step as
already done.
