---
layout: home

hero:
  name: EasySB
  text: All-in-one sing-box deployment panel
  tagline: "An all-in-one panel for Linux VPS: five protocols, certificate issuance, subscription generation and traffic accounting in one interactive menu, with the sing-box core compiled into the binary."
  image:
    src: /logo.svg
    alt: EasySB
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/quickstart
    - theme: alt
      text: Read the Docs
      link: /en/guide/intro
    - theme: alt
      text: GitHub
      link: https://github.com/EasySB-Team/EasySB

features:
  - title: Install with one command
    details: "An install script shaped like get.docker.com: it checks the Debian / Ubuntu release, writes a signed apt source, then hands over to apt, so later upgrades are just apt upgrade."
  - title: Five protocols out of the box
    details: "AnyTLS, Hysteria2, TUIC v5, VLESS + Vision + Reality and VMess + WebSocket + TLS, with ports arranged one by one and per-user, per-protocol credentials."
  - title: The core is compiled into the panel
    details: "sing-box is a direct go.mod dependency, so a node is just easysb core run; there is no kernel binary to download, replace or switch."
  - title: Built-in certificate issuance
    details: "Let's Encrypt certificates are requested inside the panel process through go-acme/lego with HTTP-01 validation, no acme.sh or socat, and renewal is driven by its own systemd timer."
  - title: Accounts and traffic accounting
    details: "Every account has per-protocol credentials, with quota, expiry, allowed protocols, enable switches, traffic reset and token rotation; accounts over quota are removed from the core config automatically."
  - title: Measurement toolbox
    details: "Streaming / AI / regional unlock checks, China three-network backtrace, nearby and three-network speed tests, IP quality, mail ports, and CPU and disk benchmarks, with verdicts of unlocked / locked / unknown only."

---

## Install with one command

The install script checks the machine's `/etc/os-release` against the releases EasySB ships for, writes a signed apt source, and lets apt install the candidate version. The source is the GitHub Release itself, fixed at `https://github.com/EasySB-Team/EasySB/releases/latest/download`, so one source entry keeps working indefinitely.

```bash
curl -fsSL https://github.com/EasySB-Team/EasySB/releases/latest/download/install.sh | sudo bash
```

After install, open the panel with the shortcut:

```bash
sb
```

Debian 12+ / Ubuntu 24.04+ (systemd, amd64 and arm64) are supported, and root is required.

## Why EasySB

EasySB turns "what can this VPS actually do, and how do I make it a usable node" into a single dark dashboard. The panel itself is one static binary, and the five protocol samples in `templates/` are readable, copyable JSONC: use the templates alone, or let the program write them for you.

| Capability | Description |
| :--- | :--- |
| Five-protocol deployment | Ports are asked one by one: Enter takes the default, `r` randomizes, a number sets it; the node keeps only material that does not belong to an account |
| Accounts and traffic | Independent per-user, per-protocol credentials, with quota / expiry / allowed protocols / enable / reset / token rotation |
| Subscription generation | One `/sub/<token>` per account, format chosen from the User-Agent, with usage reported |
| Certificate management | lego requests, views, switches, deletes and auto-renews certificates in-process, with no external script |
| Port hopping | Hysteria2 DNAT rules, applied automatically and backed by a boot-time restore unit |
| Toolbox | Unlock, backtrace, speed, IP quality, port and hardware measurements in one place, with a remembered board |

## Next steps

1. Read [Introduction](/en/guide/intro) for the overall design.
2. Follow [Quick Start](/en/guide/quickstart) through your first install.
3. Look up [Config Templates](/en/config/templates) and [Subscription](/en/features/subscription) for exact parameters.
