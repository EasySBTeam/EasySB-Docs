---
title: Subscription
---

# Subscription

Each account has exactly one subscription URL, and the format is chosen automatically by the client that fetches it. The URL looks like:

```text
https://<domain>:8443/sub/<token>
```

The subscription service is part of the panel itself (non-interactive mode `easysb --serve`, carried by `easysb.service`), listening on `SUB_SERVE_PORT` (default `8443`). It also drives the traffic accounting loop. It needs no nginx and does no traffic forwarding at all: sing-box listens for WebSocket itself, and the subscription service only hands out configuration.

## One URL, format negotiated by client

The subscription content is decided by the request's User-Agent, so the same URL serves sing-box, mihomo / Clash Meta and v2rayN at once. Matching lowercases everything and hits in the order sing-box first, then Clash-family, then the Base64 document:

| User-Agent marker | Content | Content-Type |
| :--- | :--- | :--- |
| `sing-box`, `sfi/`, `sfa/`, `sfm/` | sing-box JSON configuration | `application/json; charset=utf-8` |
| `clash`, `mihomo`, `stash`, `meta` | mihomo / Clash Meta YAML configuration | `text/yaml; charset=utf-8` |
| Everything else (v2rayN, passwall, passwall2, homeproxy, browsers, `curl`, empty) | Base64 share-link document | `text/plain; charset=utf-8` |

The Base64 document is the common format: v2rayN imports it directly, and `passwall`, `passwall2` and `homeproxy` on OpenWrt Base64-decode the same document before parsing it line by line. `luci-app-nikki` runs the mihomo core and requires a top-level `proxies` key, so it is served the mihomo configuration.

When the User-Agent cannot be recognized, force a format:

```text
https://<domain>:8443/sub/<token>?client=singbox
https://<domain>:8443/sub/<token>?client=mihomo
https://<domain>:8443/sub/<token>?client=v2ray
```

Every share link keeps the canonical hyphenated UUID. `homeproxy` validates nodes with LuCI's `uuid`, and the 32-character unhyphenated form is rejected as invalid.

## Response headers and usage reporting

Every successful response to `/sub/<token>` carries usage headers, so Clash Verge Rev, Clash Orbit and v2rayN can show remaining traffic and remaining days directly:

```text
Subscription-Userinfo: upload=<bytes>; download=<bytes>; total=<bytes>; expire=<unix seconds>
```

- `total=0` means unlimited traffic.
- When an account never expires, `expire` is omitted, because some clients read `expire=0` as "expired".
- It also carries `Cache-Control: no-store`, because the document contains account credentials.

## Disabled, expired and over quota

Account state is a derived value rather than a stored field: disabled (switched off by an administrator), expired (`expire_at` has passed), over quota (`used_bytes >= quota_bytes`), and otherwise usable. When a request hits one of these states, the service returns `403` with a plain-text reason (bilingual), instead of a half-built configuration with "no nodes":

| Case | Response |
| :--- | :--- |
| Unknown token | `404` |
| Account disabled | `403`, `账号已停用 / account disabled` |
| Account expired | `403`, `账号已过期 / account expired` |
| Traffic exhausted | `403`, `流量已用尽 / traffic quota exhausted` |
| No protocol enabled | `403`, `未为该账号启用任何协议 / no protocol enabled for this account` |

A half-built configuration is rejected by Clash-family parsers (empty `proxies`) or makes sing-box fail to parse, so refusing is safer than handing it out. Recovery (renewal, quota reset, re-enabling) takes effect in the opposite direction.

## TLS and plaintext

When a real certificate acceptable to clients exists for the domain, the subscription service terminates TLS with it; otherwise it serves plain HTTP and says so in the panel, because the subscription content carries account credentials. The decision is `cert.Usable`: a self-signed placeholder does not count, because clients would reject it. The URL the panel prints and the certificate the listener loads ask the same question, so a client never receives an `https://` URL whose listener actually speaks HTTP.

## QR codes and account identity

The panel provides terminal QR codes for each client format (requires `qrencode`). The payload differs by client:

- sing-box is wrapped in the deep link `sing-box://import-remote-profile?url=...`, the form its scanner expects.
- mihomo and v2rayN use the plain subscription URL: Clash-family scanners treat the scanned text directly as a subscription URL, while `clash://install-config?url=...` only works when a browser clicks the deep link.

The token in the subscription URL is the access key and also the user name the core side uses for accounting. Rotating the token immediately invalidates the old subscription URL, but the protocol credentials already handed out keep working, so revoking access requires disabling or deleting the account; renaming an account does not change the token and clients do not need to re-import. See [Accounts and Usage](/en/config/users) for the token-to-account relationship.

## Sync interval and quota reset

- Traffic is sampled every `SUB_SYNC_SECONDS` (default `300` seconds, minimum `30`): the panel calls `StatsService/QueryStats` (`reset=true`) through a built-in gRPC client and adds the delta to stored counters. Core counters are in-process and reset on restart, so what is persisted is the increment.
- Quota resets on the calendar month: when `last_reset` enters a new month, `used_bytes`, `upload_bytes` and `download_bytes` go to zero. `quota_bytes: 0` means unlimited, and `expire_at` of zero means never expires.
- `Reset used traffic` in the panel only zeroes the stored counters; the core-side counters are cleared on the next `QueryStats(reset=true)`.

Quota and expiry management is in [Accounts and Usage](/en/config/users); installing, restarting and checking the subscription service is on the `Subscription management` screen.
