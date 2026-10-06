---
title: Quick Start
---

# Quick Start

This path turns a fresh Debian or Ubuntu host into a connectable node: install with one command, open the panel with `sb`, finish language, node and account, then take the subscription URL.

## Step 1: Install

The install script is shaped like Docker's `get.docker.com`: it reads the machine's `/etc/os-release`, checks that it is a supported release, writes the signed key and apt source, and hands over to apt.

```bash
curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash
```

The script also accepts two arguments:

```bash
# Point at a mirror
curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash -s -- --repo-url https://mirror.example.com

# Switch the output to English
curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash -s -- --lang E
```

::: tip
The script supports Debian 12+ and Ubuntu 24.04+ only, on amd64 and arm64. See [Requirements](/en/guide/requirements) for the full conditions, and [Install](/en/guide/install) for the apt source and `dpkg` details.
:::

## Step 2: Open the panel

After install, open the dark dashboard with the shortcut:

```bash
sb
```

`sb` is the shortcut to `easysb`; both end up at the same binary. The panel must run as root.

The first screen asks for the interface language, remembers it in `/etc/sing-box/easysb-ui.conf`, and enters the menu directly next time. You can also preset the language on the command line:

```bash
# Simplified Chinese
sb --language C

# English
sb --language E
```

## Step 3: First-run flow

Every operation starts from the main menu. A first deployment only needs the following order:

1. Enter `Node Management` from the main menu and choose `One-click deploy`. The panel asks for each protocol to enable and its port. Enter takes the default, `r` randomizes, and a number sets it manually.
2. If a protocol needing a certificate was enabled, request one under `Domain Management` first. The request runs a DNS and port check, then briefly stops the core to free port 80.
3. Enter `Accounts and traffic` and choose `New account`. Set the name, remark, quota, expiry and allowed protocols. Each protocol credential for the account is generated here.
4. Go back to `Subscription management` and pick the account: the panel prints the subscription URL prefix and each protocol's share link, and can also show a QR code.

The deployment flow warns when the node has no account, because there is no identity to connect with yet. This is a warning rather than a refusal, and a node can still be deployed ahead of accounts.

::: tip
The package does not enable or start services automatically. A fresh machine has no node config yet; run `sb` to configure the node first, and the panel will enable and start `sing-box.service` after deployment. The subscription service is written and enabled by `Install subscription service` under `Subscription management`.
:::

## Step 4: Get the subscription

Each account has exactly one subscription URL of the form `/sub/<token>`, listening on `SUB_SERVE_PORT` (default `8443`). The format is negotiated from the request's User-Agent:

| Client | Content |
| :--- | :--- |
| sing-box (SFM / SFA / SFI) | JSON configuration |
| mihomo / Clash Meta / luci-app-nikki | Full YAML configuration |
| v2rayN / passwall / passwall2 / homeproxy | Base64 share-link document |

One URL works everywhere, and `?client=singbox|mihomo|v2ray` forces a format. The content depends on the domain certificate: when a real certificate exists for the domain, the subscription service terminates TLS itself; otherwise it serves plain HTTP and says so in the panel.

The account token is both the subscription access key and the user name used for core-side accounting. Rotating the token immediately invalidates the old subscription URL, but the protocol credentials already handed out stay valid, so rotation alone does not revoke access; to actually revoke someone, disable or delete the account, which removes it from the core config. Renaming an account does not change the token, so clients do not need to re-import.

## Next steps

- To see why a subscription returns 403, or how to delete only one account: [FAQ](/en/faq).
- For every entry point and flag: [Introduction](/en/guide/intro).
- To uninstall or migrate: [Uninstall](/en/guide/uninstall).
