---
title: Introduction
---

# Introduction

EasySB is an all-in-one sing-box deployment panel for Linux VPS. It folds protocol deployment, certificate issuance, account and traffic management, subscription generation and host measurement into one dark full-screen menu, compiles to a single static binary, and is opened with the shortcut `sb`.

- Project: https://github.com/EasySBTeam/EasySB
- Core upstream: https://github.com/SagerNet/sing-box
- Full changelog: [Changelog](/en/changelog)
- Frequently asked questions: [FAQ](/en/faq)

## One static binary

EasySB is a single executable and downloads no kernel, script or helper at runtime. The sing-box core is a direct `go.mod` dependency compiled into the panel itself, and certificates are issued by `github.com/go-acme/lego/v5` inside the panel's own process. Installing the panel is installing the core, and a node is the panel started in node mode:

```
easysb core run -c /etc/sing-box/config.json
```

The direct consequence: there is no kernel binary to download, replace or switch, and no `acme.sh`, `socat` or `python` is needed to issue certificates. The only remaining runtime download is the optional BBR kernel package (`internal/bbr`); the panel's own update check (`internal/update`) only reads the published `VERSION` over HTTPS to decide whether a newer version exists, and leaves the actual upgrade to apt.

The program version lives in the repository-root `VERSION` file and is compiled into the binary with `go:embed`; the release tag is always derived as `v<VERSION>`. The kernel version is independent of the program version and is read from the sing-box release compiled in.

## Supported protocols

The five protocols cover TCP, QUIC and WebSocket, and their ports are arranged one by one at deploy time. Enter takes the default, `r` randomizes, and a number sets it manually; a conflict with another protocol prompts a reset.

| Protocol | Transport | Default port | Trait |
| :--- | :--- | :--- | :--- |
| AnyTLS | TCP + TLS | 8000 | Multi-stage Padding Scheme padding, resisting traffic fingerprinting |
| Hysteria2 | QUIC / UDP | 8001 | Excellent on lossy and high-latency links, supports port hopping |
| TUIC v5 | QUIC / UDP | 8002 | 0-RTT handshake, `native` UDP forwarding, low latency |
| VLESS + Vision + Reality | TCP | 8003 | Certificate-free masquerade, borrows `apple.com` by default, resists active probing |
| VMess + WebSocket + TLS | WS over TLS | 8004 | Traverses CDNs and reverse proxies, built on standard TLS |

::: warning
Except for VLESS + Vision + Reality, every protocol needs a domain that resolves to this machine and can obtain a valid certificate. See [Requirements](/en/guide/requirements).
:::

## Capability overview

| Capability | Description |
| :--- | :--- |
| Five-protocol deployment | Ports arranged one by one; the node keeps only material that does not belong to an account (such as the Reality key pair), and credentials belong to their account |
| Accounts and traffic | Each account has independent credentials per protocol, with quota, expiry, allowed protocols, an enable switch, traffic reset and token rotation |
| Subscription generation | One `/sub/<token>` per account, the built-in service picks the format from the client, and reports usage through `Subscription-Userinfo` |
| Certificate management | Request, view, switch active, delete and auto-renew Let's Encrypt certificates in-process, with no external script |
| Port hopping | Hysteria2 defaults to `2080:3000`, applies iptables / nftables DNAT automatically and writes a boot-time restore unit |
| Service management | Start, stop, restart, view status and enable on boot |
| BBR acceleration | View and enable BBR, install the prebuilt BBRv3 kernel published by Linux-BBR-v3, remove it and clear settings from the panel |
| Toolbox | Unlock checks, three-network backtrace, speed tests, IP quality, mail ports and hardware performance in one place |
| Bilingual | Pick the language on first launch; the whole interface follows it |

See [Supported Protocols](/en/features/protocols), [Subscription](/en/features/subscription) and [Toolbox](/en/features/toolbox) for more.

## Repository layout

```text
.
├── main.go                       # Go entry point: flags, core subcommands, --tool
├── VERSION                       # Program version, the only source of the release tag
├── release/TAGS                  # The only source of the build tags
├── install.sh                    # One-command installer (writes the signed apt source and hands over to apt)
├── Makefile                      # Build, test and packaging entry point (see make help)
├── packaging/                    # Package lifecycle scripts (deb/) and apt repo builder (repo/)
├── go.mod / go.sum               # module github.com/EasySBTeam/EasySB, Go 1.27.1
├── templates/                    # Readable JSONC protocol samples and subscription templates
│   ├── anytls/
│   ├── hysteria2/
│   ├── tuic/
│   ├── vmess-websocket-tls/
│   ├── vless-vision-reality/
│   └── config/
│       ├── tun-fakeip.json       # sing-box TUN + FakeIP subscription template
│       └── mihomo.yaml           # mihomo / Clash Meta subscription template (readable mirror)
├── internal/                     # Every implementation package
├── assets/                       # README banner
├── docs/                         # Engineering docs for contributors
├── README.md                     # English description
└── README_ZH.md                  # Chinese description
```

The protocol samples under `templates/` are readable, copyable JSONC; with the comments removed they serve as server or client configuration. The subscription templates actually loaded at runtime are embedded with `//go:embed` from `internal/subscribe/`, while `templates/config/` holds the readable mirrors, and the pairs must be kept in sync when edited.

## Next steps

1. Read [Requirements](/en/guide/requirements) to confirm the system, architecture, domain and ports.
2. Follow [Quick Start](/en/guide/quickstart) through the first install and deployment.
3. Look up [Install](/en/guide/install) for `dpkg`, apt source or packaging details.
4. To see the shape of a configuration before deploying, start with [Config Templates](/en/config/templates).
