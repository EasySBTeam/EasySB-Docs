---
title: Supported Protocols
---

# Supported Protocols

EasySB arranges five sing-box protocols on one machine at a time. Each protocol has a default port asked one by one at install time, every account has independent credentials on every protocol, and the node keeps only material that belongs to no account (the Reality key pair).

| Protocol | Transport | Default port | Masquerade / crypto | Needs domain and cert |
| :--- | :--- | :--- | :--- | :--- |
| AnyTLS | TCP + TLS | 8000 | Certificate TLS | Yes |
| Hysteria2 | QUIC / UDP | 8001 | TLS (ALPN `h3`) | Yes |
| TUIC v5 | QUIC / UDP | 8002 | TLS (ALPN `h3`) | Yes |
| VLESS + Vision + Reality | TCP | 8003 | REALITY (certificate-free) | No |
| VMess + WebSocket + TLS | WS over TLS | 8004 | Certificate TLS | Yes |

Except for VLESS + Reality, every protocol needs a domain that resolves to this machine and a valid certificate. See [Certificates](/en/features/certificates) for issuance and renewal.

## Port arrangement

The five ports are asked one by one at deploy time, with the same rules:

- Press Enter to take the protocol's default port.
- Type `r` for a random port.
- Type a number to set the port manually.
- A conflict with an assigned port prompts a reset.

Ports and protocol switches are stored in `/etc/sing-box/easysb.conf` (`PORT_*` and `IS_*`). The actual server configuration is rendered by the panel into `/etc/sing-box/config.json`.

## Protocol by protocol

### AnyTLS (8000 / TCP + TLS)

- Transport: TCP, wrapped in standard TLS.
- Fingerprint resistance: `padding_scheme` multi-stage padding, changing initial packet sizes and interaction rhythm to resist traffic analysis.
- ALPN offers `h3`, `h2` and `http/1.1`, imitating ordinary HTTPS negotiation.
- Account credential: `password`.
- Needs a domain and certificate.

### Hysteria2 (8001 / QUIC)

- Transport: QUIC (UDP) over TLS, with ALPN fixed to `h3`.
- Key trait: excellent on lossy and high-latency links; supports port hopping.
- Node-level parameters: `up_mbps` / `down_mbps` are bandwidth estimates for the whole node, not per account.
- Account credential: `password`.
- Needs a domain and certificate.

Port hopping applies DNAT rules to a UDP port range; see [Firewall and Port Hopping](/en/features/firewall).

### TUIC v5 (8002 / QUIC)

- Transport: QUIC (UDP) over TLS, with ALPN `h3`.
- Key trait: 0-RTT fast handshake and `native` UDP forwarding, with low latency.
- Congestion control defaults to `bbr`.
- Account credential: `uuid` and `password` together.
- Needs a domain and certificate.

### VLESS + Vision + Reality (8003 / TCP)

- Transport: TCP wrapped in REALITY, requesting and using no certificate.
- Key trait: `xtls-rprx-vision` flow control removes the double TLS handshake and packet-length fingerprint; resists active probing.
- Masquerade target: borrows `apple.com` by default, with the handshake going back to `apple.com:443`.
- Account credential: `uuid`.
- Needs no domain and no certificate.

The Reality key pair belongs to the node rather than an account: `REALITY_PRIVATE`, `REALITY_PUBLIC` and `REALITY_SHORT_ID` are generated at deploy time and stored in node state; client share links use `pbk` (public key) and `sid` (Short ID), while the private key stays on the server.

::: warning
`REALITY_PRIVATE` belongs on the server only. Once it leaks, the masquerade can be impersonated. The private key in the repository templates is a sample value and must be replaced before deployment.
:::

### VMess + WebSocket + TLS (8004)

- Transport: WebSocket over TLS, with the WebSocket path `/vmess`.
- Key trait: traverses CDNs and reverse proxies; supports Early Data (`max_early_data` 2048, carried by the `Sec-WebSocket-Protocol` header).
- Account credential: `uuid`.
- Needs a domain and certificate.

## Account credentials and node material

The account store `/etc/sing-box/easysb-users.json` is the only source of credentials. Every account has independent credentials on every protocol, with fields differing by protocol:

| Protocol | Credential fields |
| :--- | :--- |
| AnyTLS | `password` |
| Hysteria2 | `password` |
| TUIC v5 | `uuid` + `password` |
| VLESS + Reality | `uuid` |
| VMess + WS + TLS | `uuid` |

Credentials are generated when a protocol is selected and kept when it is deselected, so re-selecting does not invalidate a client's existing import. The node's `users` array and `stats.users` both come from the same routable account set, and disabled, expired or over-quota accounts are removed from the core configuration. See [Accounts and Usage](/en/config/users) for quotas, expiry and token management.

## Templates and validation

The protocol samples under `templates/` are readable JSONC; with the comments removed they serve as sing-box server or client configuration. The templates used for subscriptions are embedded with `go:embed` from `internal/subscribe/`, maintained as pairs with the readable mirrors under `templates/config/`. The template list is in [Config Templates](/en/config/templates).

Because the core is compiled into the panel, validating a configuration needs no separate sing-box install:

```bash
# Validate a server config with the engine compiled into the panel
easysb core check -c /etc/sing-box/config.json

# Print the kernel version this binary carries and whether it can account traffic
easysb core version
```

See [Core Build](/en/config/core-builds) for the build tags and the role of `with_quic` / `with_utls` / `with_v2ray_api`.
