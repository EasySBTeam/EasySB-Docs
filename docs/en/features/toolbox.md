---
title: Toolbox
---

# Toolbox

The toolbox is the single place that measures "what this machine can actually do": one entry per item, one report per item, and the board remembers each item's last result. Results are written to `/etc/sing-box/easysb-toolbox.json`, so they are still there after closing and reopening the panel.

**Opening the screen runs nothing automatically.** Speed tests, backtrace and benchmarks are not things that should start on a keypress; every item must be entered and started manually.

## Four groups

| Group | Items |
| :--- | :--- |
| Unlock checks | Streaming unlock (Netflix, Disney+, YouTube Premium, Prime Video, DAZN, TVBAnywhere+, Spotify, Reddit, TikTok), AI unlock (ChatGPT, Gemini, Claude), regional unlock (Steam, three Bilibili regions, Bahamut Anime) |
| Network checks | Three-network backtrace, nearby speed test, three-network speed test |
| IP and ports | IP quality (several databases + DNS blocklists), mail ports (can it run a mail server) |
| Hardware and performance | System info, disk info, CPU benchmark, memory test, disk IO (sequential + 4K random), multi-disk IO |

Item ids: `unlock-media`, `unlock-ai`, `unlock-region`, `backtrace`, `speed-near`, `speed-cn`, `ipquality`, `portcheck`, `hw-info`, `hw-disk`, `bench-cpu`, `bench-mem`, `bench-disk`, `bench-disks`.

## The board

The board is the block above the grouped items: it shows each selected item's last result and how long ago it ran, with never-run items shown as "not checked". `Toolbox → Board settings` decides the board content by group or by selecting everything at once, and the selection is stored with the other interface preferences in `BOARD=` in `easysb-ui.conf`.

An unconfigured panel shows the default items (`tools.BoardDefault()`): the three unlock checks, three-network backtrace, IP quality and system info. Two rules keep the board readable:

- One item per line, in registration order, not reordered by "most recently run".
- Only the summary of the summary; more content lives in the item's own report.

When everything is switched off, the board says so explicitly, distinguishing itself from an empty board.

## Verdicts and regions

Unlock items have only three verdicts, with a "region" column, one service per table row:

| Verdict | Meaning |
| :--- | :--- |
| Unlocked | The service answered, and its own reply says this address works. |
| Locked | The service refused, or accepted only half (half-usable is not usable). |
| Unknown | The reply cannot be read: a Cloudflare challenge page, a timeout, no verdict on the page. The reason is written in the note under the table and is never guessed as unlocked. |

The "region" column is each service's own judgment, not something the panel computes. Different services sit behind different geolocation databases, and the same machine being judged as different countries by different services is common.

::: tip
Prime Video storefront pages come in several shapes, one of which carries no geographic information; the probe reads the marker and retries up to three times before deciding. When Claude returns a Cloudflare challenge for a data-center address it is recorded as "Unknown", with the region read from `claude.ai/cdn-cgi/trace`, because the challenge shows Cloudflare distrusts the address rather than naming a country.
:::

## Interface and keys

The toolbox keeps the panel's uniform fixed layout: every screen has the same two stacked boxes, at the same size and position as the main screen; screens with many items are clipped inside the box with a note of how many lines remain, and **the panel does not scroll**. While running, the two boxes merge into one, and items with a known total give a real progress percentage; when a report table is too tall it can be read inside the box with the arrow keys, PageUp/PageDown and Home/End. Keys are uniform:

- **Q exits the panel from any screen.**
- **Esc returns one level up**, and it is the only key that goes back.
- **Enter is only for entering and confirming**, never for going back.

## Without a terminal

Without a TTY, the same items can be run from the command line:

```bash
# List every item
sb --tool list

# Three-network backtrace
sb --tool backtrace

# Streaming unlock
sb --tool unlock-media

# A report that runs all 17 unlock checks at once
sb --unlock
```

`sb --tool` prints the item name first, then a plain-text table; on failure it gives an error. Command-line runs are written to the board file too, so the in-panel board sees them.

## Where the numbers come from

The toolbox downloads no programs; every item is Go code in this binary:

- Unlock items: one to three HTTP requests per service, parsed by `internal/unlock`, with no login and no CAPTCHA breaking.
- Three-network backtrace: local ICMP probing (the panel runs as root), then ASN lookups for hops through ip-api.com.
- Speed tests: `github.com/showwin/speedtest-go` against speedtest.net, run in-process; the three-network test filters to China Telecom / Unicom / Mobile servers only, so an overseas host often gets an empty list, which it reports honestly.
- IP quality: nine keyless databases plus twelve DNS blocklists.
- Mail ports: TCP connections to the machine's public address, plus PTR and FCrDNS lookups.
- System and disk info: reads `/proc`, `/sys` and mount points; `systemd-detect-virt`, `timedatectl` and `smartctl` are used only when installed.
- Benchmarks: the panel's own CPU, memory and disk workloads, timed with the standard library.

::: warning
The CPU benchmark is not a Geekbench score and the disk numbers are not fio results; they are the panel's own workloads, meant only for comparison with the same panel on another machine. The project premise is to install no external programs, so it will not download tools (no Geekbench / sysbench / fio) just to benchmark.
:::

The measurement basis, the trade-offs against fusion-monster ecs, and the differences between each item and the reference scripts are recorded in the engineering doc `docs/toolbox.md`.
