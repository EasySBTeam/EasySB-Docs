---
title: Headless Deployment
---

# Headless Deployment

The panel is a full-screen interface meant for a person, but a whole deployment can also be done in one pass from a JSON manifest with no TTY. That entry point is `sb --provision`: it reads the manifest, issues the certificate, writes the nodes and accounts, renders the core config, installs and starts the services, then prints each account's subscription URL. Scripts, CI and bulk provisioning use it so each machine does not need the menu driven by hand.

The prerequisites match [Quick Start](/en/guide/quickstart): EasySB is already installed on the target, the ports are open, and a protocol that needs a certificate has a domain that already resolves to the host.

## Running it

```bash
# Read from a file
sudo sb --provision deploy.json

# Read from standard input, the usual form in a script;
# nothing is left on the machine after the pipe closes
sudo sb --provision - <<'JSON'
{
  "domain": "sb.example.com",
  "email": "ops@example.com",
  "accounts": [{ "name": "alice" }]
}
JSON
```

The manifest is validated before it is executed. An unknown protocol, a port out of range, a node port colliding with the subscription port, an account selecting a node that does not exist, or a mistyped field all fail before anything is changed, so a failed re-run leaves no half-written configuration.

## Manifest format

A manifest carrying every field, usable as a starting point:

```json
{
  "domain": "sb.example.com",
  "email": "ops@example.com",
  "server_ip": "203.0.113.10",
  "sub_port": 8443,
  "nodes": [
    { "protocol": "anytls" },
    { "protocol": "vless-reality" },
    { "protocol": "hysteria2", "port": 8001, "hop_range": "2080:3000" },
    { "protocol": "tuic" }
  ],
  "accounts": [
    { "name": "alice", "quota_gb": 100, "expire_days": 30 },
    { "name": "bob", "nodes": ["anytls"], "password": "a-shared-secret" }
  ]
}
```

### Top-level fields

| Field | Required | Meaning |
| :--- | :--- | :--- |
| `domain` | When any protocol other than VLESS + Reality is used | Certificate domain; omit it for a Reality-only host |
| `email` | Together with `domain` | ACME account email, used for expiry notices |
| `server_ip` | No | Written to state; the subscription URL falls back to it when no domain is given |
| `sub_port` | No | Subscription service port, default `8443` |
| `nodes` | No | Nodes to deploy; omitting it means all five protocols at their default ports |
| `accounts` | No | Accounts to create |

### nodes[]

| Field | Required | Meaning |
| :--- | :--- | :--- |
| `protocol` | Yes | One of `anytls`, `hysteria2`, `tuic`, `vless-reality`, `vmess-ws-tls` |
| `name` | No | Node name, defaulting to the protocol label; a duplicate is rejected |
| `port` | No | Defaults to the protocol's 8000 to 8004; 1 to 65535, and neither `sub_port` nor another node may share it |
| `sni` | No | VLESS + Reality only, default `apple.com` |
| `hop_range` | No | Hysteria2 only, default `2080:3000` |

### accounts[]

| Field | Required | Meaning |
| :--- | :--- | :--- |
| `name` | Yes | Account name, unique among accounts |
| `password` | No | Written to the protocols that use a password (AnyTLS, Hysteria2, TUIC) |
| `uuid` | No | Written to the protocols that use a UUID (TUIC, VLESS + Reality, VMess + WS + TLS) |
| `quota_gb` | No | Traffic quota in GiB, `0` for unlimited |
| `expire_days` | No | Validity in days, `0` for no expiry |
| `nodes` | No | Allowed nodes by protocol key or node name; omitting it means every node |

A credential left out is generated as a random value by the panel; a value you supply goes only to the protocols that actually use that field, so giving `password` to a UUID-only protocol adds no stray field.

## Idempotence and re-runs

The manifest describes a desired state rather than a script, so running it again is safe:

- Nodes match by name, or by protocol plus port. An existing node keeps its id and key material, so a Reality key pair never changes on a re-run.
- Accounts match by name. An existing account has its quota, expiry and node selection updated while keeping its subscription token and existing per-protocol credentials. A subscription URL already imported by a client therefore never changes on a re-run.
- When a certificate is needed, ACME is only re-run once the local leaf certificate nears expiry, the same rule the panel uses.

## How it relates to the panel

`--provision` takes the same internal path the panel does: `internal/cert` issues the certificate in process, the nodes and accounts are written to the same two store files the panel reads, and `internal/deploy` renders and validates the config. The first deploy also applies the port-hopping firewall, writes and enables `easysb-firewall.service`, and installs the subscription service unit. After a manifest run, opening the panel shows exactly what the manifest produced, and later changes can still be made there.

The manifest does not cover BBR; that stays on the panel's `BBR` screen.

## Verify

```bash
sb --version
systemctl status sing-box
systemctl status easysb
easysb core check -c /etc/sing-box/config.json
curl -fsS 'https://<domain>:8443/sub/<token>'
```

A successful `--provision` prints each account's subscription URL, ready to hand to a client. With no certificate installed for the domain (a Reality-only host, for example) the subscription service serves plain HTTP and the printed URL is `http://` to match.

## Next steps

- Prerequisites on ports, domain and architecture: [Requirements](/en/guide/requirements).
- To see every entry point and flag first: [Introduction](/en/guide/intro).
- How deployment works underneath: [Architecture](/en/dev/architecture), [Design](/en/dev/design).
