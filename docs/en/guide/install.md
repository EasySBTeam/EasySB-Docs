---
title: Install
---

# Install

EasySB is distributed as a Debian / Ubuntu package, with the panel and the core in the same `.deb`. There are two ways to install: the one-command script that sets up the apt source and installs, or a manual `dpkg -i` of a single package.

## One-command install

```bash
curl -fsSL https://github.com/MinimaxFlora/EasySB/releases/latest/download/install.sh | sudo bash
```

The script does the same shape of work as Docker's `get.docker.com`:

1. Reads `/etc/os-release` and checks that the machine is a supported Debian / Ubuntu release (rejecting it otherwise).
2. Fetches the armored public key from the source root, dearmors it, and writes `/usr/share/keyrings/easysb-archive-keyring.gpg`.
3. Writes one `deb` source line into `/etc/apt/sources.list.d/easysb.list`.
4. Runs `apt-get update` and `apt-get install easysb`.

Script arguments:

| Argument | Description |
| :--- | :--- |
| `--repo-url URL` | Source root, default `https://github.com/MinimaxFlora/EasySB/releases/latest/download`; also settable through `EASYSB_REPO_URL` |
| `--lang C\|E` | Script output language, Chinese by default |
| `-h` / `--help` | Show usage |

## How the apt source works

The source is the GitHub Release itself, fixed at `https://github.com/MinimaxFlora/EasySB/releases/latest/download`, whose address never changes with the version (the workflow keeps only the newest release, so `latest` always resolves), so one source entry keeps working indefinitely. The line the install script writes looks like:

```text
deb [signed-by=/usr/share/keyrings/easysb-archive-keyring.gpg] https://github.com/MinimaxFlora/EasySB/releases/latest/download ./
```

Supported releases:

| Distribution | Versions |
| :--- | :--- |
| Debian | 12, 13 |
| Ubuntu | 24.04 |

Key paths:

| Path | Content |
| :--- | :--- |
| `/usr/share/keyrings/easysb-archive-keyring.gpg` | The dearmored signing key used by `signed-by` |
| `/etc/apt/sources.list.d/easysb.list` | The apt source line above |
| `https://github.com/MinimaxFlora/EasySB/releases/latest/download/easysb-archive-keyring.asc` | The armored public key attached to the release |

The source is a flat apt repository: every file (`Packages`, the signed `Release` / `InRelease` / `Release.gpg`, the public key, `install.sh` and one `.deb` per architecture) sits in one directory, and the distribution field is `./`. The indexes are signed by the release flow with a GPG key; when the signing key is missing the release fails rather than attaching unsigned indexes. One package serves every supported release: it depends on nothing but `ca-certificates`, so the version string carries no distribution (for example `6.0.0-1`), and upgrading the distribution does not change which one apt installs.

With the source configured, apt installs and upgrades:

```bash
# Install
sudo apt update && sudo apt install easysb

# Upgrade
sudo apt upgrade
```

## dpkg install

To skip the source, download the `.deb` for the matching architecture from GitHub Releases and install it directly. The current version is 6.0.0, and the asset name looks like `easysb_6.0.0-1_amd64.deb`:

```bash
# amd64 or arm64
sudo dpkg -i easysb_6.0.0-1_amd64.deb

# Fill in missing dependencies
sudo apt-get -f install
```

## Package contents

One `.deb` carries both the panel and the core (compiled into the binary), so installing it is all there is:

| Path | Content |
| :--- | :--- |
| `/usr/bin/easysb` | The panel, with the sing-box core compiled in |
| `/usr/bin/sb` | The `easysb` shortcut |
| `/usr/lib/systemd/system/sing-box.service` | Node unit: `easysb core run -c /etc/sing-box/config.json` |
| `/usr/lib/systemd/system/easysb.service` | Subscription service unit: `easysb --serve` |
| `/usr/share/licenses/easysb/LICENSE` | Full license text |

The two systemd units inside the package are printed by the binary itself:

```bash
# Node unit
sb --print-unit node

# Subscription service unit
sb --print-unit sub

# Set the executable path written into the unit (default /usr/bin/easysb)
sb --print-unit node --unit-exec /usr/bin/easysb
```

Packaging and the panel's runtime unit writing use the same code, so the packaged units and the runtime-written units cannot drift apart.

## Why nothing starts automatically on install

The package ships the units but deliberately does not enable or start them. The reason is direct: a fresh machine has no node config yet, and starting the node service then is meaningless. The correct order is to run `sb` and configure the node first; the panel then enables and starts `sing-box.service` after deployment. The subscription service is written and enabled by `Install subscription service` under `Subscription management`.

Packaged units live in `/usr/lib/systemd/system`, while the panel writes its units into `/etc/systemd/system`. When the panel's copy exists it takes precedence, and the packaged copy is the fallback, so the two never fight over the same path.

## Next steps

- The first deployment flow is in [Quick Start](/en/guide/quickstart).
- Uninstall and cleanup are in [Uninstall](/en/guide/uninstall).
