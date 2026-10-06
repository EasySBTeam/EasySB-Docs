---
title: Requirements
---

# Requirements

EasySB targets a Linux VPS or dedicated server. Confirm the system, permission, domain and network conditions below before installing.

## Operating system

| Item | Requirement |
| :--- | :--- |
| Distribution | Debian 12 (bookworm), Debian 13 (trixie), Ubuntu 24.04 (noble) |
| Wider upper bound | The docs state the supported range as Debian 12+ and Ubuntu 24.04+, provided the machine is still a supported release |
| Init system | systemd |
| Permission | root (the install script tries `sudo` when not root, and stops outright when `sudo` is missing) |

The apt source covers Debian 12/13 and Ubuntu 24.04. The install script checks the machine's `/etc/os-release` against the supported releases; an unsupported distribution is rejected rather than given a source that does not exist.

::: warning
EasySB supports systemd only. Other init systems such as OpenRC are out of scope.
:::

## Architecture

Only two architectures are published, matching the BBR kernels EasySB covers:

| Architecture | Debian spelling |
| :--- | :--- |
| x86_64 | `amd64` |
| aarch64 | `arm64` |

No `.deb` exists for other architectures, and neither the install script nor the apt source offers one.

## Domain and certificate

Except for VLESS + Vision + Reality, the other four protocols are built on standard TLS and need a domain that satisfies the following:

- The domain resolves to this machine's address (an A or AAAA record).
- This machine can obtain a valid certificate for the domain.
- No configuration under the domain is intercepted by a CDN proxy; with Cloudflare's orange cloud, the HTTP-01 challenge is answered by the CDN and never reaches the machine.

VLESS + Vision + Reality does not depend on a certificate and can deploy a node on its own, with no domain required.

::: tip
Certificates are requested from Let's Encrypt by lego inside the panel process over HTTP-01 standalone, with no script downloaded. The request checks DNS first and briefly stops the core to free port 80. When a domain has several A records, Let's Encrypt validates each one, and a stale dead record makes issuance fail.
:::

## Ports

| Port | Purpose |
| :--- | :--- |
| 80 | ACME HTTP-01 validation, reachable and free while requesting a certificate |
| 443 | Optional TLS protocol listening port |
| 8000 / 8001 / 8002 / 8003 / 8004 | Default ports of the five protocols, changeable in the panel |
| 2080:3000 | Default UDP range of Hysteria2 port hopping |
| 8443 | Default port of the built-in subscription service (`SUB_SERVE_PORT`) |

The slowest step of issuing a certificate is the real engine's validation; when port 80 is occupied the panel reports the occupant first. The core is stopped temporarily during issuance, so port 80 must not be held permanently by another program.

## Network access

- The deployment target is an overseas host with direct GitHub access. The optional BBR kernel package is downloaded straight from `github.com` releases, and the panel's own update check also reads public version information on GitHub.
- The panel does not prefix downloads with a mirror; reintroducing a mirror to work around a local network problem is not the intended usage.
- Toolbox entries such as unlock checks, speed tests and IP quality make requests to the services being measured, so the matching outbound access is needed at runtime. Opening the toolbox runs nothing automatically.

## Resources

The panel is a single static binary with a small resident footprint. The real resource cost comes from the node itself and from toolbox benchmarks and disk IO that run on demand, all triggered manually by you.
