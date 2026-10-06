---
title: Conventions
---

# Conventions and Preferences

## Naming

- Directories in the repository are lowercase ASCII: `templates/`, `docs/`, `assets/`. Template subdirectories are too (`anytls`, `hysteria2`, `tuic`, `vmess-websocket-tls`, `vless-vision-reality`, `config`).
- Go packages stay lowercase single words (`state`, `subscribe`, `sysinfo`). Interfaces and stores are named after what they model, not after an interface screen: the account model is `internal/user` with a `Store`, labeled `Accounts and traffic` in the panel.
- Protocol display names keep brand casing in prose (`AnyTLS`, `Hysteria2`, `TUIC v5`), while protocol keys and paths are lowercase.

## Language

- `README.md` is English and is the default documentation.
- `README_ZH.md` is the Chinese translation. The two stay in sync; a feature is only complete once both describe it.
- Code identifiers, comments, commit subjects for non-trivial code, and these docs are all English. User-facing interface strings are bilingual through `internal/i18n`, with one deliberate exception: the toolbox's own report bodies. A tool's column labels, summaries and notes are the tool's own wording, because inserting a translation layer between a measurement and its label is exactly where numbers get attached to the wrong word. The split between panel wording and tool wording is in `docs/toolbox.md`.

## Version

- `VERSION` holds the program version, currently in `X.Y.Z` form.
- `VERSION` is the only place this number is written: it is embedded with `go:embed`, and `install.sh` never needs it because apt resolves the package itself. Do not add a `main.version` default or a script constant.
- The program version is independent of the sing-box core version.
- The release tag is `v<VERSION>`, and the release name is the same string. The workflow, `internal/update` and the release notes all derive the tag from the version; do not create a second naming scheme. Only the latest release is kept: the workflow cleans up older releases and their tags after each release.
- The release asset is one `.deb` per architecture, `easysb_<version>-1_<arch>.deb`, where `<arch>` uses the Debian spelling (`amd64`, `arm64`) and `-1` is the package's own revision. `dist/easysb-linux-<asset>` is an intermediate and is never published on its own.
- The apt source is the GitHub Release itself, so the one-command `install.sh` has a single fixed address (`https://github.com/EasySBTeam/EasySB/releases/latest/download`) to point at. That directory carries `install.sh` itself, so this one command (`curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash`) needs no second address. It is a flat ("trivial") apt repository: every file sits in one directory (`Packages` and the signed `Release` / `InRelease` / `Release.gpg`, the public key `easysb-archive-keyring.asc`, `install.sh`, and one `.deb` per architecture), so there is no `dists/<suite>` split. `make repo` builds and signs it (`apt-ftparchive`), and the release job attaches it to the release. One package serves every distribution; `install.sh` still maps a machine to a supported Debian or Ubuntu release only to reject one we do not ship for.

## Commits

- Use conventional commits: `type(scope): subject`, for example `fix(tui): collapse the trailing blank line` or `test(update): cover release tag derivation`.
- Keep the subject to one line. Explain why in the body when it is not obvious.
- Do not add co-author trailers.

## Code

- Run `gofmt` before committing; the tree must be gofmt clean.
- Run `go vet ./...` and `go test ./...` before pushing.
- Prefer small packages with a single responsibility, and write doc comments on packages and exported identifiers.
- Avoid comments that restate the code; keep comments for intent and gotchas.

## Testing

- Unit tests live beside the code and are named `*_test.go`.
- The TUI has a render smoke path: `--render --width W --height H` prints one frame, making overflow and alignment regressions testable without a TTY.
- Prefer table-driven tests for parsing and mapping logic.

## Release

- `.github/workflows/easysb-go-release.yml` cross-compiles `linux/amd64` and `linux/arm64` (the two architectures the BBR kernels cover), runs when watched paths change and are pushed to `master`, and publishes one release tagged and named `v<VERSION>` with one `.deb` per architecture. The publish job then cleans up older releases and their tags, so the Releases page shows only the current version.
- The `.deb` (`make deb`) is built by fpm from one staged tree; architecture names live in the Makefile's `DEBARCH_MAP`, keyed by asset name, one table serving both packaging and layout. `pkg-stage` UPX-compresses the binary on the way into the staged tree, so the release asset and the apt source carry the same compressed bytes. Packaged units come from `easysb --print-unit`; do not hand-write units under `packaging/`.
- `make repo` (`packaging/repo/index.sh`, via `apt-ftparchive`) lays the `.deb` out as a flat apt repository and signs it. The release job attaches `dist/repo/*` to the release, which serves as the source root; `packaging/repo/` is the only place that decides the layout.
- The apt index is signed with a passphrase-protected key: the secrets are `GPG_PRIVATE_KEY` and `GPG_PASSPHRASE`, and signing reads the passphrase from a `0600` file so it never appears in the process list. The release job requires `GPG_PRIVATE_KEY` and fails without it, because an unsigned source is not something `install.sh` should ever point a machine at.
- After a force push, trigger the workflow with an ordinary push; a force push does not reliably produce an Actions `push` event.

## Documentation hygiene

- Update the `## [Unreleased]` section of `CHANGELOG.md` for structural or behavioral changes, moving entries under a version heading at release time.
- Keep `docs/` current when layout or core decisions change.

## Related pages

- [Architecture](/en/dev/architecture)
- [Design](/en/dev/design)
- [Pitfalls](/en/dev/pitfalls)
- [Build and Test](/en/dev/build)
