---
title: Runtime Paths
---

# Runtime Paths

EasySB keeps node state, rendered configuration, the account store, certificates, interface preferences and service units under fixed paths. The table below is the complete runtime inventory; entries without an explicit permission follow the defaults of their directory and process.

## Path table

| Path | Owner | Purpose | Permission |
| :--- | :--- | :--- | :--- |
| `/etc/sing-box/easysb.conf` | `internal/state` | Persisted node state, compatible with the legacy KV layout | `0600` |
| `/etc/sing-box/config.json` | `internal/config` | Rendered server configuration; carries the same credentials as the account store | `0600` |
| `/etc/sing-box/cert/` | `internal/cert` | Self-signed placeholder certificate pair, used before a real certificate is issued | Directory |
| `/etc/sing-box/easysb-users.json` | `internal/user` | Accounts: credentials, quota, expiry and counters | `0600` |
| `/etc/systemd/system/easysb.service` | `internal/service` | Subscription service unit (`easysb --serve`) | Unit file |
| `/etc/systemd/system/sing-box.service` | `internal/service` | Core service unit | Unit file |
| `/etc/sing-box/acme/` | `internal/cert` | ACME state; overridable with `EASYSB_ACME_DIR` | Directory |
| `/etc/sing-box/acme/account.key`, `account.json` | `internal/cert` | ACME account material | `0600` |
| `/etc/sing-box/acme/<domain>/fullchain.cer` | `internal/cert` | Certificate chain in each domain directory | `0644` |
| `/etc/sing-box/acme/<domain>/private.key` | `internal/cert` | Certificate private key in each domain directory | `0600` |
| `/etc/sysctl.d/99-easysb-bbr.conf` | `internal/bbr` | BBR settings written by EasySB | Config file |
| `/etc/modules-load.d/easysb-bbr.conf` | `internal/bbr` | Load `tcp_bbr` at boot | Config file |
| `/etc/sing-box/easysb-ui.conf` | `internal/prefs` | Interface choices (skin, palette, marker set, language); overridable with `EASYSB_UI_CONF` | `0644` |
| `/etc/systemd/system/easysb-acme.timer` | `internal/cert` | Certificate renewal timer | Unit file |

## Overrides

Two environment variables can move state files off their default locations, for testing or unusual layouts:

| Variable | Affected paths | Default |
| :--- | :--- | :--- |
| `EASYSB_ACME_DIR` | The ACME state directory: `account.key`, `account.json` and the per-domain certificate directories | `/etc/sing-box/acme/` |
| `EASYSB_UI_CONF` | The interface preferences file | `/etc/sing-box/easysb-ui.conf` |

## Program and package paths

After `.deb` installation the panel and the core are in the same binary, and the matching unit text is printed by the binary itself (`sb --print-unit node|sub`), using the same code the panel writes units with at runtime, so the packaged and runtime units cannot drift apart.

| Path | Content |
| :--- | :--- |
| `/usr/bin/easysb` | The panel, with the sing-box core compiled in |
| `/usr/bin/sb` | The `easysb` shortcut |
| `/usr/lib/systemd/system/sing-box.service` | Node unit: `easysb core run -c /etc/sing-box/config.json` |
| `/usr/lib/systemd/system/easysb.service` | Subscription service unit: `easysb --serve` |
| `/usr/share/licenses/easysb/LICENSE` | Full license text |

Nothing is enabled or started on install: a fresh machine has no node config yet, so run `sb` to configure the node first, and the panel enables and starts services automatically.

## Notes

`config.json` and `easysb-users.json` both carry account credentials, so both are tightened to `0600`. The account store is written atomically (`*.tmp-*` temporary file plus rename), and state files are written the same way; see [Accounts and Usage](/en/config/users) for the account model.

`99-easysb-bbr.conf` and `easysb-bbr.conf` are written by EasySB itself, so they never conflict with the BBR kernel project's own drop-ins. The sysctl file carries comments recording replaced values, which the clear operation uses to restore them; installed kernel packages are managed by dpkg and removed through apt.

The unit of `easysb-acme.timer` names the binary path that wrote it, so it is installed from inside the panel (or with `--install-renew-timer`) rather than copied between hosts. Certificates are issued and renewed in-process by the panel through lego, so this timer is the only renewer, and `--renew-certs` reloads `sing-box` and the subscription service after renewal.

Under packaging, the units provided by the `.deb` live in `/usr/lib/systemd/system`, while the panel writes its units to `/etc/systemd/system`, so the panel's copy takes precedence while it exists and the packaged copy is a fallback; the two never fight over the same path. See [Architecture](/en/dev/architecture) for the background.

## Related

- [Architecture](/en/dev/architecture)
- [Accounts and Usage](/en/config/users)
- [Core Build](/en/config/core-builds)
- [Config Templates](/en/config/templates)
