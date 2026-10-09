---
title: Design
---

# Design Principles

These are the decisions that shape the codebase. When a change conflicts with one of them, treat it as a design discussion rather than a local edit.

::: tip
This page describes intent and trade-offs; see [Architecture](/en/dev/architecture) for where things actually land, and [Conventions](/en/dev/conventions) for naming and commit rules.
:::

## One static binary

The sing-box core, certificate issuance and the panel compile into a single static binary. There is no runtime package-manager call on the hot path, and issuing a certificate needs no script interpreter. The `.deb` shortcut after install is `sb`.

## Legacy-compatible state

`/etc/sing-box/easysb.conf` keeps the old bash tool's KV layout. The Go build and the shell build can inspect the same deployment. Do not change existing keys; add new ones. The exception is a key that describes a component which no longer exists: v4 removed `SUB_PORT` and `SUB_PATH` in the same change that removed the nginx site, because a key nobody reads is dead weight. Removing a key requires removing its component and updating every doc that mentions it.

## Templates are readable first

`templates/` holds human-readable, copyable JSONC. sing-box's parser accepts comments, and EasySB strips them before rendering subscriptions so it emits standard JSON. The subscription templates that ship inside the binary are `internal/subscribe/tun-fakeip.json` and `internal/subscribe/mihomo.yaml`; the readable mirrors are `templates/config/tun-fakeip.json` and `templates/config/mihomo.yaml`.

## Bilingual by construction

Every user-facing string flows through `internal/i18n`. The language is a `Lang` value (`C` or `E`), never a global boolean. `L` switches it at runtime. New strings must be added for both languages in the same commit.

## Version is data, not code

`VERSION` is the single source of truth and is compiled into the binary with `go:embed`. A bare `go build` and an official release therefore report the same number, with no `-ldflags -X main.version` to keep in sync and no second constant to drift. The workflow publishes with the `v<VERSION>` tag; `internal/update` reads the same number from the published `VERSION` file, derives the tag from it, and lets apt perform the upgrade. Never hardcode the release tag in more than one place.

## Non-interactive entry points

Any capability a boot unit needs must be reachable without a TTY. `--apply-firewall` is the model: it loads state, applies rules, writes the unit and exits. The TUI calls the same set of package functions. `--provision` is the other end of that principle: a whole deployment, certificate, nodes, accounts and subscription, is an idempotent operation over one JSON manifest, again calling only the package functions the panel uses, with the difference that no TUI is in front collecting input. The manifest describes a desired state rather than a script, so a re-run neither recreates nodes nor rotates a subscription token already handed out.

## A dark, quiet terminal interface

The default palette is dark with cyan as the main accent. At startup the TUI asks the terminal for its background color and switches to a deepened light palette when the background is light, so the dark palette's near-white body text never lands on white; `--theme` (or `EASYSB_THEME`) forces `dark` or `light`. The interface uses the alternate screen, one border, and one accent color per state (ok / warn / error). Spacing is explicit: separators and menu items each get exactly one blank line, and the dashboard drops low-priority panels before overflowing a short terminal.

## Two boxes on one screen

Every screen has the same shape: a status line first, then the screen's own board in the top box and its items in the bottom box. The main menu and a section differ only in what goes in the two boxes, the wordmark and panel board versus a section's board, so border sizes do not change as you move between screens and the key hints do not move. Sections exit with `Esc`, like submenus, and `--render --screen <id>` can draw any of them to check the layout.

## Long operations report their own progress

A task that downloads something streams a reading to the screen rather than printing a line per megabyte: `internal/download` reports byte counts through a `Progress` callback, and `internal/tui` collects them in the task reporter and draws a progress bar above the log. Anything that may take minutes, the panel's own binary and the kernel package, goes through this path; steps that only change local state stay quiet rather than showing a progress bar that never moves. The core is no longer on that list: it is compiled in, so the node has no downloads.

## Direct downloads, tolerant parsing

Deployment targets are overseas hosts with direct GitHub access, so binary and kernel-package downloads go straight to `github.com` with no mirror prefix. Release tag parsing still tolerates a missing `v` prefix, because the `releases.atom` feed omits it.

## Related pages

- [Architecture](/en/dev/architecture)
- [Conventions](/en/dev/conventions)
- [Pitfalls](/en/dev/pitfalls)
- [Build and Test](/en/dev/build)
