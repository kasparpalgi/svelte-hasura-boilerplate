
## Follow-up: mutual SSH between Mac, Karel and Dell

> "All three machines shall access each other. Eg. I might run something on Dell but agent may need to access Mac etc."

**Done.** `ssh mac|karel|dell` works non-interactively in all six directions (key auth, tested with `BatchMode`).
- Dell had no key of its own, so I created `~/.ssh/id_ed25519` there (`ppa@dell->karel,mac`) and authorized it on Karel and the Mac.
- Karel's existing key is authorized on Dell (already) and now the Mac.
- `~/.ssh/config` on Karel and Dell gets `Host mac|dell|karel` entries using LAN addresses
  (Mac `192.168.0.110`, Karel `192.168.0.107:9812`, Dell `192.168.0.111`; user `klarity`/`krl`/`ppa`).
  The Mac keeps its existing aliases (public IP).
- The addresses came from `../server/.env` (`SSH_MAC`). No tunnel or Tailscale was needed because all three are on one LAN.

**Caveat:** the LAN IPs are hard-coded. If the router hands out a new address, set a DHCP reservation for the three machines, or the aliases break.
