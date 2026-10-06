---
title: Core Build
---

# Core Build

`github.com/sagernet/sing-box` is a dependency of this module. The core is no longer a file: the version is a line in `go.mod`, a node is this binary started in node mode, and there is no kernel on the host to download, install, unpack or switch.

```text
go.mod                        github.com/sagernet/sing-box v1.14.2
internal/sbcore               engine: run, check, version, build capabilities
/etc/systemd/system/sing-box.service
                              ExecStart=/usr/bin/easysb core run -c /etc/sing-box/config.json
easysb core run -c <config>   node
easysb core check -c <config> the same engine, building the config then closing it
easysb core version           the core version and capabilities this binary carries
```

`internal/sbcore.Run` builds the configuration, starts an instance with the same library that will actually serve the node, and blocks until the service manager ends the process; `Check` does the same build without `Start`, which is exactly the step the deploy path runs before restarting the node. Both go through `include.Context`, the registry set used by the upstream command line, so a configuration the panel accepts is a configuration `sing-box` itself accepts.

## Node and commands

The node is started by `sing-box.service`, running:

```bash
# Node mode: start the core and block inside the service
easysb core run -c /etc/sing-box/config.json
```

Two helper subcommands:

```bash
# Validate a config with the carried engine, without starting a node
easysb core check -c /etc/sing-box/config.json

# Print the core version this binary carries and its traffic accounting capability
easysb core version
```

`core` is the only subcommand. Writing a configuration and passing validation is a fixed step before the panel restarts the node.

## Build tags

Build tags decide what the binary can express, so they are part of the product rather than a build detail. The tags are defined in exactly one place, `release/TAGS`, read by both the `Makefile` and `.github/workflows/easysb-go-release.yml`:

```text
with_clash_api,with_quic,with_utls,with_v2ray_api,with_wireguard
```

Every tag has a clear purpose:

| Tag | Purpose |
| :--- | :--- |
| `with_quic` | Hysteria2 and TUIC inbounds; without it the core rejects any node configuration containing a QUIC protocol |
| `with_utls` | Reality inbounds; without it Reality cannot be built |
| `with_v2ray_api` | Per-account byte counting, that is, the traffic column of `Accounts and traffic` |
| `with_clash_api` | The Clash-compatible API block named in subscription documents |
| `with_wireguard` | Configuration naming a WireGuard endpoint |

This set is deliberately narrower than upstream's `release/DEFAULT_BUILD_TAGS`: the panel carries only the capabilities its node and the configurations it hands out actually use. Every kept tag is verified on both release builds (`linux/amd64` and `linux/arm64`).

Upstream also carries tags the panel deliberately omits: `with_acme` (the panel's certificates come from `internal/cert`, which talks to the CA itself), `with_dhcp`, `with_gvisor` and `with_tailscale`. They only add size, because the node the panel runs never names those capabilities. `with_naive_outbound` is omitted too: it pulls in cronet / Chromium libraries, which have no usable build on any release architecture.

One consequence worth knowing: the WireGuard userspace stack is backed by gVisor, so with only `with_wireguard` the endpoint type and system stack are kept, while a userspace-stack endpoint reports `gVisor is not included in this build`. The panel's own node never names WireGuard, so this only affects hand-written configurations.

## Traffic accounting capability is a pair of files

**`with_v2ray_api` is the critical tag**: it is sing-box's only way to count bytes per account, and the source of the traffic column in `Accounts and traffic`. A tag cannot be probed at runtime (compiled in is compiled in, not compiled in is not), so the capability is implemented as a pair of files rather than a runtime check:

| File | Tag | `sbcore.StatsCapable()` |
| :--- | :--- | :--- |
| `internal/sbcore/stats_on.go` | `with_v2ray_api` | `true` |
| `internal/sbcore/stats_off.go` | `!with_v2ray_api` | `false` |

The deploy path asks it before writing `experimental.v2ray_api`: the core rejects a complete configuration that names an API it lacks (`v2ray api is not included in this build`), so a build without the tag must omit the block. Such a build can still deploy a working node; the panel says so in the deploy log, and the accounting loop skips sampling instead of erroring at a socket nobody is listening on every cycle. Release builds always carry the tag; only developer builds without `-tags` do not.

## The QUIC rejection message

**`with_quic` is the other tag that surfaces in the core's own words.** Hysteria2 and TUIC are QUIC protocols, and a build without the tag rejects any configuration containing either:

```text
QUIC is not included in this build, rebuild with -tags with_quic
```

The deploy path logs the core's exact words and stops; this is an honest failure, but not a working node. `release/TAGS` includes it, so this only affects hand-written builds. The tests in `internal/deploy` are split the same way: the five-protocol documents sit behind the `with_quic` tag, alongside a document every build accepts and tagged acceptance tests.

## What an operator sees

There is no `Core management` section in the panel: a panel cannot manage a core installed inside it. The version appears where the panel's own version appears (the system card and the version line on every screen), reading like:

```text
1.14.2 · counters on
```

Here `counters on` / `no counters` is `StatsCapable()`, the same fact the deploy path uses, so the tag never contradicts the node's actual behavior. The menu item that used to open `Core management` now opens the `Toolbox`, the measurement toolbox that answers the questions a VPS operator actually asks: what services this IP can use, what the backtrace looks like, how fast the machine is. See [Toolbox](/en/features/toolbox).

`internal/sbcore.Version` prefers the version stamp written at release time (`-X github.com/sagernet/sing-box/constant.Version=…`) and falls back to the dependency's module version, so local builds and releases report the same number.

## Related

- [Architecture](/en/dev/architecture)
- [Config Templates](/en/config/templates)
- [Accounts and Usage](/en/config/users)
- [Runtime Paths](/en/config/paths)
