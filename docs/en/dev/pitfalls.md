---
title: Pitfalls
---

# Pitfalls and Lessons

Traps this repository has already hit. Each gives the symptom and the fix.

## Release and CI

- **A force push does not trigger Actions.** After rewriting history, the `push` workflow may not start even though the branch moved. Trigger it with an ordinary follow-up commit and push. The release assets come from that run.
- **A rewrite can orphan an old release.** Rewriting the commit a release tag points at makes the old tag/release unreachable (it starts returning 404). Re-release under the current tag scheme.
- **An older run can overwrite a newer asset.** The workflow uses a `concurrency` group with `cancel-in-progress`, so a stale build cannot overwrite a newer one.
- **Only the latest release is kept.** `action-gh-release` overwrites same-named assets but leaves others, so the publish job clears its own assets first, then deletes every other release and its tag (`gh release delete --cleanup-tag`). The Releases page should show one version; a leftover older release means the cleanup step did not run.
- **The `Release` file must be generated outside its own tree.** `apt-ftparchive release .` checks every file under the directory, so an already-existing `Release` would be listed in its own checksums. `index.sh` writes `Release` to a temp file outside `dist/repo` first and moves it in afterwards.
- **The repository is flat, so `Filename` must be a bare name.** The source is a GitHub Release whose assets have no directory structure, so `Packages` lists `Filename: easysb_6.0.0-1_amd64.deb`, with no `./` and no `pool/` prefix. `index.sh` strips the `./` that `apt-ftparchive packages .` writes, so apt builds the download URL as `<release root>/<name>`.
- **The apt source must be signed.** When `GPG_PRIVATE_KEY` is missing the release job fails rather than attaching an unsigned index: `install.sh` writes a `signed-by=` entry, and apt rejects a source whose index is not signed by that key.
- **A machine maps to a supported release, but one package serves them all.** There is no suite directory any more, so `install.sh`'s release check only rejects a distribution we do not ship for; it no longer selects an index.

## Version and identity

- **`/etc/os-release` can shadow `VERSION`.** In the old shell, sourcing `/etc/os-release` overwrites the script's version variable. The Go build embeds a dedicated `VERSION` file with `go:embed`, so there is one number and no `main.version` fallback to keep in sync.
- **There is one tag scheme only.** The workflow, release notes and `internal/update` must all derive `v<VERSION>`. A hardcoded tag somewhere silently breaks update checks, so `internal/update` reads the published `VERSION` rather than pinning a number.

::: warning
`VERSION` is the single version source. Do not reintroduce a `main.version` default or a version constant in `install.sh`.
:::

## sing-box integration

- **QR payloads differ by client.** sing-box needs its deep link (`sing-box://import-remote-profile?url=...`, `subscribe.ImportScheme`); a bare URL is not recognized, which is exactly what used to break sing-box QR scanning. Clash-family clients are the opposite: their scanners hand the decoded text to an HTTP client, so mihomo (and v2rayN) must carry the plain endpoint URL. A `clash://install-config?url=...` link works only as an OS deep link, never from a scanned QR code.
- **AnyTLS and Hysteria2 URIs need a slash before the query.** Emitting `anytls://pass@host:port?query` makes clients reject the link; the canonical form is `anytls://pass@host:port/?query`. Credentials must also be percent-encoded (`url.User` / `url.UserPassword`), or an `@` or `/` in a generated password truncates the URI. Generated passwords avoid the problem by staying alphanumeric (`secret.Password`, alphabet `[A-Za-z0-9]`), the intersection every target parser accepts. OpenWrt's homeproxy drops userinfo containing `%`, so a standard base64 password (`+`/`/`/`=`) would silently lose the password; staying alphanumeric avoids it.
- **Share links keep canonical UUIDs.** Emitting the 32-character unhyphenated form makes homeproxy mark the node as an invalid UUID through its LuCI `uuid` check, even though sing-box's gofrs parser accepts it. Every share link keeps the hyphenated form.
- **The Base64 document is the common format.** v2rayN reads it directly; passwall, passwall2 and homeproxy Base64-decode it first. No separate "base" format is needed. `luci-app-nikki` runs the mihomo core and validates by a top-level `proxies` key, so it needs the mihomo YAML configuration, which the same `/sub/<token>` endpoint serves when it sees a Clash-family User-Agent.
- **Template actions in comments are still expanded.** `text/template` executes its template actions even inside YAML/JSON comments. A `.Proxies` action in a mihomo header comment injects uncommented proxy entries above the document root and makes the configuration unparseable. Keep actions out of comments.
- **Build tags cannot be probed at runtime.** Whether this binary counts traffic per account depends on `with_v2ray_api`, so the answer lives in a tagged file pair (`internal/sbcore/stats_on.go` / `stats_off.go`), and the deploy path asks `sbcore.StatsCapable()` before writing `experimental.v2ray_api`: the core rejects an entire configuration that names an API it was not built with (`v2ray api is not included in this build`).
- **`with_naive_outbound` must stay out of `release/TAGS`.** Upstream's `DEFAULT_BUILD_TAGS` includes it, and it pulls in cronet / Chromium libraries that need `with_purego` and have no build for every target: copying the upstream list verbatim breaks the release. The panel's node configuration never uses a naive outbound, so the tag set is deliberately narrower.
- **Downloads assume direct GitHub access.** Deployment targets are overseas, so binary and kernel-package downloads go straight to `github.com`. Mirror prefixes were removed on purpose; do not reintroduce them to work around a local network problem.
- **Comments are extended JSON, not standard JSON.** The `templates/` files are JSONC for humans; sing-box's extended parser accepts comments and merged fields, and both `sing-box check` and `easysb core check` read them directly. When the panel renders a real configuration it writes out the document with the comments removed.

### WireGuard and gVisor

```text
with_clash_api,with_quic,with_utls,with_v2ray_api,with_wireguard
```

This is the content of `release/TAGS`. It does not include `with_gvisor`, so the WireGuard userspace stack is unavailable: `with_wireguard` alone keeps the endpoint type and system stack, and a userspace-stack endpoint reports `gVisor is not included in this build`. The panel's own node never names WireGuard, so this only affects hand-written configurations.

::: tip
Build tags are defined in exactly one place, `release/TAGS`. Builds, tests and releases all read the same file; do not copy it into a `go build` command line or workflow.
:::

## Toolchain

- **Go 1.27.1.** `go.mod` pins the toolchain. With `GOTOOLCHAIN=auto` Go downloads it automatically; CI uses `go-version-file: go.mod`. Do not lower it casually.
- **Charm v2 uses vanity import paths** (`charm.land/*`) rather than the old `github.com/charmbracelet/*` module paths. Follow the existing imports.

## State and templates

- **Keep the two subscription templates in sync.** Runtime uses the embedded `internal/subscribe/tun-fakeip.json`; `templates/config/tun-fakeip.json` is the readable mirror. Changing only one causes drift. The same goes for the mihomo template, `internal/subscribe/mihomo.yaml` and `templates/config/mihomo.yaml`.
- **Do not rename state keys.** `easysb.conf` stays compatible with the old shell tool; only add keys, never repurpose them.
- **Renaming a directory touches docs and GitHub metadata.** A folder rename must update `README.md`, `README_ZH.md`, `CHANGELOG.md`, `.github/CODEOWNERS` and `.github/PULL_REQUEST_TEMPLATE.md`.

## Terminal and testing

- **Interactive behavior needs a PTY.** For one-off frame checks use `--render --width W --height H`, which prints a single frame without a TTY. Use it to catch overflow and alignment regressions.
- **Icons assume a Unicode terminal, not a patched font.** The default symbol set is a single-column geometric set already shipped by ordinary monospace fonts; `--icons ascii` (or `EASYSB_ICONS=ascii`) covers terminals without Unicode. Never let the layout depend on a glyph being wider than one character.
- **Mouse reporting steals click-drag selection.** When a task / QR screen enables `MouseModeCellMotion` for the wheel, the terminal no longer selects text on drag, and users cannot copy the subscription URL the usual way. That screen therefore offers `C` (copy the whole log to the OSC52 clipboard) and `M` (release the mouse and restore native selection). If mouse capture is added elsewhere, provide the same escape hatch.
- **After `git filter-branch`, `refs/original/*` remains.** It is a local backup of the pre-rewrite refs. Keep it, or clean it intentionally; do not push it.

## Related pages

- [Architecture](/en/dev/architecture)
- [Design](/en/dev/design)
- [Conventions](/en/dev/conventions)
- [Build and Test](/en/dev/build)
