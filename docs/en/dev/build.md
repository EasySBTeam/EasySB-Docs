---
title: Build and Test
---

# Build and Test

Every entry point is in the `Makefile`; use `make help` to list all targets. Bare Go commands work too, and `make build` only adds `-trimpath`, the tags from `release/TAGS` and a commit stamp.

## Common commands

```bash
# Build ./easysb with the tags from release/TAGS
make

# The full pre-commit gate: gofmt -l + go vet + tagged tests
make check

# Cross-compile every release architecture into dist/
make dist

# Package the dist/ binaries into .deb files with fpm
make deb

# Lay the .deb files out as a signed flat apt repository (dist/repo)
make repo

# Render one desktop frame and exit, no TTY needed
make render

# Render every screen and assert the layout (needs python3)
make screens

# List every target
make help
```

## What `make check` does

`make check` is the pre-commit gate, equivalent to `make lint test`:

- `gofmt -l .`: lists files whose formatting differs; non-empty output fails (target `fmt-check`).
- `go vet` runs twice: once with the tags from `release/TAGS`, once without tags (target `vet`).
- `go test -tags "$(TAGS)" ./...`: runs tests with the release tags (target `test`).

Running each part separately:

```bash
# Format in place
make fmt

# Format check only
make fmt-check

# Format + vet
make lint

# Run tests without tags, covering the build without traffic counters
make test-plain

# Run tests with the race detector
make test-race
```

## Bare Go equivalents

Build tags are defined in exactly one place, `release/TAGS`, so the command line reads that file rather than copying the list:

```bash
# Build the binary with tags read from release/TAGS
go build -trimpath -tags "$(tr -d '[:space:]' < release/TAGS)" -o easysb .

# Quick build without tags
go build -trimpath -o easysb .

# Run every test with tags
go test -tags "$(tr -d '[:space:]' < release/TAGS)" ./...

# Run every test without tags
go test ./...

# Run vet once with and once without tags
go vet -tags "$(tr -d '[:space:]' < release/TAGS)" ./...
go vet ./...
```

`make version` prints the version, commit, tags and Go version, for confirming the current build configuration:

```bash
make version
```

## Core subcommands

The sing-box core is compiled into this binary, so there is no kernel binary to install or switch. `core` is the only subcommand:

```bash
# Print the sing-box version and capabilities this binary carries
./easysb core version

# Validate a config with the same core, building but not starting
./easysb core check -c /etc/sing-box/config.json

# Run in node mode; this is what the service unit's ExecStart uses
./easysb core run -c /etc/sing-box/config.json
```

`core check` and `core run` both go through `internal/sbcore`, using the same registry set as the upstream command line, so a configuration the panel accepts is a configuration `sing-box` itself accepts. The deploy path runs `Check` before restarting the node.

## Build tags

Build tags decide what the binary can express, so they belong to the product rather than a build detail. They live in `release/TAGS`, one line, read by both the Makefile and the release workflow:

```text
with_clash_api,with_quic,with_utls,with_v2ray_api,with_wireguard
```

This set is deliberately narrower than upstream's `release/DEFAULT_BUILD_TAGS`: the panel carries only what its node and the configurations it distributes actually name. `with_v2ray_api` is needed for per-account byte counting and shows up as a tagged file pair (`internal/sbcore/stats_on.go` / `stats_off.go`), with the deploy path asking `sbcore.StatsCapable()` before writing `experimental.v2ray_api`. See [Core Build](/en/config/core-builds) for more detail.

::: warning
Do not copy the upstream tag list. `with_naive_outbound` pulls in cronet / Chromium libraries and cannot be built on every release architecture; add only tags verified on both `linux/amd64` and `linux/arm64` release builds.
:::

## Rendering without a TTY

Interactive behavior needs a PTY, but layout checks do not. `--render` prints a single frame and exits, which is good for catching overflow and alignment regressions without a TTY:

```bash
# Render one frame at a given size
./easysb --render --width 100 --height 40

# Render a specific screen: a section id, system, task, toolbox-report or a bbr screen
./easysb --render --screen system --width 100 --height 40
```

`make render` is shorthand for `./easysb --render --width 100 --height 40`; `make screens` renders every screen and asserts the layout.

## Architecture and packaging

Releases cover only the two server architectures Debian and Ubuntu actually use, `amd64` and `arm64` (the two the BBR kernels cover). The mapping from asset name to Go target triple and to Debian architecture name is defined once, in the Makefile (`GOARCH_*` and `DEBARCH_MAP`), shared by `dist` and packaging. `pkg-stage` UPX-compresses the binary on the way into the staged tree, so the release asset and the apt source carry the same bytes. Package partitioning and unit generation are in [Architecture](/en/dev/architecture).

## Related pages

- [Architecture](/en/dev/architecture)
- [Design](/en/dev/design)
- [Conventions](/en/dev/conventions)
- [Pitfalls](/en/dev/pitfalls)
- [Core Build](/en/config/core-builds)
- [Runtime Paths](/en/config/paths)
