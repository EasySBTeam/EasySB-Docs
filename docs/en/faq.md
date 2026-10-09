---
title: FAQ
---

# Frequently Asked Questions

The questions and answers below come from the project's engineering docs and implementation, and explain the most common points of confusion.

## Why is the core compiled into the panel?

sing-box is a direct `go.mod` dependency compiled into the panel itself. A node is the panel started in node mode, `easysb core run -c /etc/sing-box/config.json`. That has two consequences: there is no kernel binary to download, replace or switch, and installing the panel is installing the core; `easysb core check` validates a configuration with the same engine that will actually serve the node, and it is what the deploy path runs before restarting the service.

The panel's version line honestly shows the core version and whether this build can count traffic. Whether it can depends on the build tag `with_v2ray_api` (defined in `release/TAGS`); the panel reads `sbcore.StatsCapable()` rather than assuming, so a build without the tag still deploys a working node and simply does not count usage.

## How do I disable one account without affecting the others?

Every account has its own credentials on every protocol it has ever enabled. To revoke someone's access, disable or delete the account under `Accounts and traffic`; the other accounts' credentials are completely unaffected, and disabling or deleting removes the account from the core configuration.

Rotating the token immediately invalidates the old subscription URL, but the protocol credentials already handed out stay valid, so rotating the token alone does not revoke access. Renaming an account does not change the token, so clients do not need to re-import.

## Why does a subscription return 403?

The subscription service returns `403` with a plain-text reason for disabled, expired or over-quota accounts, rather than a half-built configuration with no nodes. The reason is that an empty node list is unparseable for Clash-family clients, and an unparseable configuration is harder to diagnose than a clear error.

When it returns 403, the response still carries the `Subscription-Userinfo` header, so clients can show used traffic and expiry time. Such accounts are removed from the core configuration on the next accounting cycle.

## Why is the subscription token also the accounting user name?

sing-box's V2Ray counter keys look like `user>>><name>>>traffic>>>...`, and this name both aggregates counts and serves as the `QueryStats` regex pattern. The token is a random ASCII string, unique by construction and stable across renames, and contains no regex metacharacters; a display name may be Chinese or contain regex metacharacters and is unsuitable for the role.

For the same reason, the inbound `users` array and `stats.users` must come from the same decision source (`user.Store.Routable`), or an account may authenticate but never be counted.

## Do I need to install nginx?

No. Subscriptions are served by the built-in service `easysb --serve`, running as `easysb.service`, responding to `/sub/<token>` on `SUB_SERVE_PORT` (default `8443`). It negotiates the format from the User-Agent, terminates TLS itself when a real certificate exists for the domain, and can report usage in the response.

The nginx static subscription site from older versions has been removed, and there is no separate nginx configuration fragment to maintain.

## What if I have no domain?

VLESS + Vision + Reality does not depend on a certificate, needs no domain, and can deploy a node on its own. The other four protocols are built on standard TLS and need a domain that resolves to this machine and can obtain a valid certificate.

Behind a CDN proxy (Cloudflare's orange cloud, for example), the HTTP-01 challenge is answered by the CDN and never reaches the machine, so issuance fails. The panel runs a DNS pre-check before requesting and warns about this.

## How do I use it without a terminal?

Many capabilities have entry points that do not depend on a TTY:

| Command | Purpose |
| :--- | :--- |
| `sb --tool list` | List every toolbox item |
| `sb --tool <id>` | Run one item and print a plain-text table |
| `sb --unlock` | Run all 17 unlock checks at once and print a report |
| `sb --provision <manifest>` | Deploy a whole host from a JSON manifest and print the subscription URLs (`-` reads standard input) |
| `sb --render --width W --height H` | Render one dashboard frame and exit; add `--screen <id>` to render a subpage |
| `easysb core check -c <config>` | Validate a node config with the compiled-in engine |
| `easysb core version` | Print the core version and capability bits this binary carries |

`sb --provision` does the nodes, the certificate and the accounts in one pass; see [Headless Deployment](/en/guide/provision) for the manifest format. Entry points used by boot units follow the same principle, for example `--apply-firewall` loads state, applies rules, writes the unit and exits immediately, all without a TTY.

## How do I switch language and interface appearance?

First launch asks for the language on the first screen, remembers it in `/etc/sing-box/easysb-ui.conf`, and enters the menu directly next time. It can also be preset on the command line:

```bash
sb --language E --skin graphite --theme dark --icons ascii
```

| Flag | Values |
| :--- | :--- |
| `--language` | `C` (Chinese) or `E` (English) |
| `--skin` | `jade` (default), `aurora`, `ember`, `graphite`, or `a` through `d` |
| `--theme` | `auto` (default), `dark`, `light` |
| `--icons` | `symbols` (default) or `ascii` |

You can also change it directly on the `System information` screen: `A` through `D` or `↑`/`↓` plus `Enter` picks a skin, `T` switches dark and light, `I` toggles between Unicode symbols and pure ASCII, and `L` switches language. Changes take effect on the next frame.

## What is the situation with gVisor and the WireGuard userspace stack?

`release/TAGS` does not include `with_gvisor` but does include `with_wireguard`. So the WireGuard system stack works, while the userspace stack depends on gVisor and using it gives `gVisor is not included in this build`.

The panel's own node configuration never uses WireGuard, so this only affects hand-written client or server configuration, not a node the panel deploys.

## How does upgrading work?

Upgrading goes through the system package manager and does not involve self-replacing a running binary. With the apt source configured, `sudo apt upgrade` upgrades `easysb` to the latest version.

The `Update version` entry in the panel reads the published `VERSION`, derives the `v<VERSION>` tag from it, upgrades the `easysb` package through apt, and prompts for a panel restart afterwards. The program version is decided solely by `VERSION` and compiled into the binary with `go:embed`, so a bare `go build` and a release report the same version number.

## What is the relationship between the core version and the program version?

They are independent of each other. The program version lives in `VERSION`, and the release tag is always derived as `v<VERSION>`; the core version comes from the sing-box release currently declared in `go.mod` (currently `v1.14.2`).

`easysb core version` prints the program version, the core version and whether the build can count traffic. The version line also shows in the form `1.14.2 · counters on`.

## Why does the subscription service sometimes use plain HTTP?

The subscription service terminates TLS only when a real certificate clients accept exists for the domain. A self-signed placeholder does not count, and clients reject it. With no usable certificate, the service falls back to plain HTTP, and the panel says so clearly, because the subscription content contains account credentials.

The URL given to the user and the protocol the listener actually uses come from the same decision (`cert.Usable`), so it never prints `https://` while listening with plain HTTP.

## Where are the configuration files?

| Path | Content | Permission |
| :--- | :--- | :--- |
| `/etc/sing-box/config.json` | Rendered server configuration, carrying the same credentials as the account store | `0600` |
| `/etc/sing-box/easysb.conf` | Node state, a KV layout compatible with the old shell tool | `0600` |
| `/etc/sing-box/easysb-users.json` | Account store, the only source of credentials | `0600` |
| `/etc/sing-box/easysb-ui.conf` | Interface preferences (skin, palette, markers, language) | `0644` |
| `/etc/sing-box/acme/` | ACME account and certificates, overridable with `EASYSB_ACME_DIR` | Account and private key `0600` |

`config.json` is `0600` because it carries the same usable credentials as the account store. State keys stay compatible with the old shell tool: only add keys, never rename or change the meaning of existing ones.

## How does certificate renewal work?

Certificates are issued and renewed by lego inside the panel process over HTTP-01 standalone. Renewal is decided from the local leaf certificate's expiry time, starting 30 days ahead, and is driven by the `easysb-acme.timer` the panel installs itself, running `easysb --renew-certs`.

Renewal reloads sing-box and the subscription service only when a new certificate was actually obtained, so the daily timer run does not needlessly drop connections. Validation needs port 80 free, and the panel stops the core beforehand to free it.

## Why is there no Geekbench or fio in the toolbox?

The toolbox's design premise is that the panel downloads no external programs. CPU, memory and disk benchmarks are the panel's own Go workloads, speed tests run in-process using a speedtest.net library, and unlock checks are just a few HTTP requests.

So items that inherently depend on external programs are not done by design, including Geekbench, sysbench, fio and mtr / nexttrace. The panel's own benchmarks are only good for comparing hosts running the same panel, and they are not equivalent to Geekbench or fio scores.

## Do port-hopping rules disappear after a restart?

No. The iptables and nftables DNAT rules themselves do not survive a restart, so the panel generates `easysb-firewall.service`. It is a oneshot unit that restores the rules with `easysb --apply-firewall` before `sing-box.service`. When Hysteria2 port hopping is not in use, the unit is not created.
