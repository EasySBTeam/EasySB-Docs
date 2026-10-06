---
title: Changelog
---

# Changelog

This page records EasySB's major milestones, newest first. The project keeps only the latest Release; for the full history see [GitHub Releases](https://github.com/EasySB-Team/EasySB), and for the finer, entry-by-entry changes see `CHANGELOG.md` at the repository root.

## v6.0.0 (current)

This version narrows the release scope to Debian / Ubuntu and moves the release channel entirely onto GitHub Releases.

### Platform and release

- The platform is narrowed to Debian / Ubuntu, the architectures to `amd64` and `arm64`, and the only package left is the `.deb`. `release/TAGS`, `VERSION` and the Makefile's architecture table narrow in step, dropping every rpm, pacman and other-architecture definition.
- The apt source becomes a flat repository attached to the GitHub Release, fixed at `https://github.com/EasySB-Team/EasySB/releases/latest/download`. `make repo` lays the `.deb` files out in one directory, generates and signs the indexes with `apt-ftparchive`, and puts the public key `easysb-archive-keyring.asc`, `install.sh` and the indexes in the same layer. One package serves every supported Debian / Ubuntu release.
- `install.sh` narrows to a minimal single apt path: check `/etc/os-release` against a supported release, write the signed key and source, then hand over to apt. Only `--repo-url` and `--lang` remain as arguments.
- The install path moves from `/usr/local/bin` to `/usr/bin`, with the panel and shortcut at `/usr/bin/easysb` and `/usr/bin/sb`.
- `make pkg-stage` UPX-compresses the binary in the staged tree, so the release assets and the apt source are the same bytes.
- Only the latest release is kept: the workflow trims the previous release and its tag after publishing.

### Upgrade and self-update

- Self-update goes through apt: `internal/update` compares the installed version with `dpkg-query`, upgrades the `easysb` package through `apt-get install`, and no longer downloads an archive to self-replace a running binary. The panel's `Update version` entry and asset names follow.

### Cleanup and hardening

- Remove the release server and server-provisioning chain; the source is served directly by the GitHub Release.
- Remove the now-unused sing-box rebuild script and workflow; the core is compiled into the panel.
- Narrow CI permissions and pin Actions versions; pull requests go through the same gate but do not publish.
- A batch of concurrency and security fixes, including a cross-process lock on the account file, a subscription service TLS decision consistent with the printed URL, atomic download writes and private temporary directories.

## v5.0.0

This version brings both the core and certificates into the panel and introduces the fixed layout and the predecessor of the measurement toolbox.

### Core compiled into the panel

- `github.com/sagernet/sing-box v1.14.2` becomes a direct `go.mod` dependency, and a node is the panel itself, `easysb core run -c /etc/sing-box/config.json`. `/etc/sing-box/sing-box` no longer exists, and installing the panel brings the core with it. Adds `internal/sbcore` and `internal/download`, removes the old `internal/core`.
- Build tags are defined in exactly one place, `release/TAGS` (currently `with_quic,with_utls,with_v2ray_api,with_clash_api,with_wireguard`). `with_v2ray_api` decides whether traffic can be counted per account, answered by a pair of tagged files in `internal/sbcore`, with `StatsCapable()` deciding before deploy whether to write `experimental.v2ray_api`.
- Removes the whole `Core management` screen; the first main-menu item first becomes `Service unlock status` and is later expanded into `Toolbox`.

### Certificates move to built-in lego

- `github.com/go-acme/lego/v5` performs ACME account registration and HTTP-01 issuance inside the panel process, no longer downloading `acme.sh` and no longer needing `socat` or `python`. The ACME account and certificates live in `/etc/sing-box/acme/`, and the renewal timer is still installed by the panel.

### Interface and measurement

- The interface is fixed into one pair of stacked boxes, sized and positioned like the main screen, with the board absorbing gaps on a short terminal and content-heavy screens clipped inside the box with a note of the remaining lines.
- Adds the service unlock check, reimplementing RegionRestrictionCheck's probes in Go, covering 17 services with only a few requests each and honestly reporting unknown when no verdict can be read. The capability later expands into the toolbox.
- Interface preferences become memorable (skin, palette, markers, language), and `--theme` plus a system information screen are added.

### Version management

- The version number converges into `VERSION` and is compiled into the binary with `go:embed`, removing the `main.version` default and `-ldflags` injection, so bare builds and releases report the same number.

## v4.0.0

This version introduces the account system, the built-in subscription service and traffic accounting.

### Accounts and traffic

- Accounts live in `/etc/sing-box/easysb-users.json` with mode `0600`. Each account has per-protocol credentials, a quota, an expiry, allowed protocols and an enable switch. Disabled, expired and over-quota accounts are removed from the core configuration automatically and added back on recovery.
- Clients need to re-import subscriptions per account. Node-level UUIDs and passwords are removed.

### Built-in subscription service

- Removes `internal/nginx` and the static subscription directory; `easysb --serve` (`easysb.service`) provides the single endpoint `/sub/<token>` on `SUB_SERVE_PORT` (default `8443`), returning sing-box JSON, mihomo YAML or a Base64 share-link document by User-Agent.
- The subscription service reads the core's `StatsService` counters every `SUB_SYNC_SECONDS` (default `300`) seconds and adds them to accounts, restarting the core when a quota or expiry is crossed; the `Subscription-Userinfo` response header reports used traffic, quota and expiry.
- State keys add `SUB_SERVE_PORT` and `SUB_SYNC_SECONDS`, and remove `SUB_PORT` and `SUB_PATH`, which described the old nginx site.

### Interface

- Adds the skin framework, with four skins and two palettes (dark and light) freely combined, chosen with `--skin` or `EASYSB_SKIN`.
- Adds the system information screen, for inspecting the runtime environment and switching skin, palette, markers and language live in the interface.
- Redoes the icon scheme, defaulting to a single-width Unicode symbol set that does not depend on Nerd Font; `--icons ascii` provides a pure-ASCII fallback.

## v3.0.0

- A full Go rewrite, removing the bash implementation. A dark full-screen dashboard built on bubbletea / bubbles / lipgloss, compiled to a single static binary and opened with `sb`.
- Command flags become Go flags: `--language`, `--icons`, `--apply-firewall`, `--render`, `--version`, `--help`.
- The dashboard becomes a multi-card layout, adding device and node information cards; releases move to `.github/workflows/easysb-go-release.yml` cross-compiling multiple platforms and publishing by version tag.

## v2.0.0

- The script is rewritten into a five-in-one deployer: AnyTLS, Hysteria2, TUIC v5, VMess + WebSocket + TLS, VLESS + Vision + Reality.
- The core source switches to the official `SagerNet/sing-box` Releases, with install, uninstall and replace while keeping configuration.
- Certificate management is based on `acme.sh --standalone`; Hysteria2 port hopping defaults to `2080:3000`, applying DNAT rules automatically and generating a boot-time restore unit.
- Subscription management is based on template rendering, served by nginx as a static site; supports both Alpine / OpenRC and Debian / Ubuntu / systemd.

::: tip
v2.0.0 and earlier were implemented as bash scripts whose details were removed along with the implementation; this record is for tracing.
:::
