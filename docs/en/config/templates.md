---
title: Config Templates
---

# Config Templates

`templates/` holds readable JSONC reference material in the repository: client / server samples for the five protocols, plus two subscription templates. They can be used as docs to cross-check fields, or, with the comments removed, directly as sing-box configuration. The subscription templates actually embedded in the panel come only from `internal/subscribe/`, and the two are mirrors of each other.

## Protocol samples

Each protocol directory holds a pair of files: `config_server.json` describes the server inbound and `config_client.json` describes the matching client. They explain fields line by line with comments; with the comments removed they are valid sing-box configuration.

| Directory | Protocol | Transport | Masquerade / crypto | Key trait |
| :--- | :--- | :--- | :--- | :--- |
| `templates/anytls/` | AnyTLS | TCP | Certificate TLS | Multi-stage Padding Scheme padding |
| `templates/hysteria2/` | Hysteria 2 | QUIC / UDP | TLS (ALPN `h3`) | Port hopping, excellent on lossy links |
| `templates/tuic/` | TUIC v5 | QUIC / UDP | TLS (ALPN `h3`) | 0-RTT handshake, `native` UDP forwarding |
| `templates/vmess-websocket-tls/` | VMess | WebSocket over TLS | Certificate TLS | Traverses CDNs, Early Data |
| `templates/vless-vision-reality/` | VLESS + Vision | TCP | REALITY (certificate-free) | `xtls-rprx-vision`, resists active probing |

File naming is consistent across directories: `config_server.json` and `config_client.json`. The server sample shows how the core accepts a connection, and the client sample shows how the same credentials are declared on the client side.

## Subscription templates

The two files under `templates/config/` are the readable mirrors of the subscription content, one for sing-box JSON and one for mihomo / Clash Meta YAML.

| File | Target client | Content |
| :--- | :--- | :--- |
| `templates/config/tun-fakeip.json` | sing-box (SFM / SFA / SFI) | TUN + FakeIP: rule routing, DNS splitting, URLTest automatic speed test |
| `templates/config/mihomo.yaml` | mihomo / Clash Meta, `luci-app-nikki` | Full client configuration: nodes, policy groups, DNS, routing rules |

The subscription service chooses among these two formats and Base64 share links from the request's User-Agent; see [Subscription](/en/features/subscription) for details. The nodes, credentials and node names in the templates are rendered by the panel per account, not fixed values.

## Readable mirrors and runtime copies

`templates/` is reference only; the running panel does not read these two directories. What is actually compiled into the binary are the same-named files under `internal/subscribe/`, embedded with `//go:embed`:

```text
templates/config/tun-fakeip.json   <->   internal/subscribe/tun-fakeip.json
templates/config/mihomo.yaml       <->   internal/subscribe/mihomo.yaml
```

When one is edited the other must be updated in step, otherwise the docs and what the panel actually serves drift apart. The readable mirror holds a rendered result with sample data, while the embedded template holds `text/template` actions and placeholders.

::: tip About JSONC
The JSON under `templates/` allows comments because it is written for people to read; sing-box's own parser also accepts comments and trailing commas. When the panel renders a real configuration it writes out the document with the comments removed.
:::

The running node configuration `/etc/sing-box/config.json` is rendered by `internal/config` from node state and accounts, not copied from these samples. To understand how accounts and credentials enter the configuration, see [Accounts and Usage](/en/config/users).

## Sample values must be replaced

::: danger Sample credentials in the templates are not for production
The UUIDs, passwords, REALITY private / public keys, Short IDs and certificate paths in the samples are all sample values. Deploying them directly is equivalent to no protection; regenerate them and keep server and client strictly consistent.
:::

Material to regenerate:

- Authentication fields: `password` in `templates/anytls/config_server.json` and `templates/hysteria2/config_server.json`, `uuid` + `password` in `templates/tuic/config_server.json`, and `uuid` in `templates/vless-vision-reality/` and `templates/vmess-websocket-tls/`.
- REALITY material: `private_key` belongs on the server only, and `short_id` must match on the client.
- Certificate paths: the samples say `/root/fullchain.cer` and `/root/private.key`; a real deployment should point at files issued by the panel with tightened permissions, and the certificate private key at `600`.

The panel's deploy flow generates independent credentials for every account, so manual replacement applies only to the "templates only" scenario.

## Validating templates

Check the syntax with the core before installing a configuration; the command only builds and parses and does not start a node:

```bash
# Validate the VLESS + Vision + Reality server sample
sing-box check -c templates/vless-vision-reality/config_server.json
```

The same engine compiled into the panel can validate it too, giving the same result as the engine that will actually serve the node:

```bash
# Validate with the core the panel carries (the same engine as the node)
easysb core check -c templates/vless-vision-reality/config_server.json
```

See [Core Build](/en/config/core-builds) for the capabilities the core is built with; if a sample uses a protocol that was not included, validation fails outright.

## Related

- [Supported Protocols](/en/features/protocols)
- [Subscription](/en/features/subscription)
- [Accounts and Usage](/en/config/users)
- [Core Build](/en/config/core-builds)
