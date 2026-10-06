---
title: Firewall and Port Hopping
---

# Firewall and Port Hopping

Hysteria2 port hopping applies DNAT to a UDP port range, redirecting traffic that lands on any port in the range to Hysteria2's real listening port. The default range is `2080:3000`, targeting `8001`.

## Rules

The panel detects an available NAT backend, preferring `iptables` and otherwise `nft`. For enabled protocol ports and the subscription service port, it also allows them with `ufw allow` when `ufw` is present and `firewall-cmd --add-port` when `firewalld` is present.

iptables rule:

```bash
# REDIRECT inbound UDP 2080 through 3000
iptables -t nat -A PREROUTING -p udp --dport 2080:3000 -j REDIRECT --to-ports 8001
```

nftables rules:

```bash
# Create the nat table and prerouting chain
nft add table ip nat
nft 'add chain ip nat prerouting { type nat hook prerouting priority dstnat; }'

# Redirect UDP 2080 through 3000
nft add rule ip nat prerouting udp dport 2080-3000 redirect to :8001
```

The range is stored in `HY2_HOP_RANGE`, default `2080:3000`; Hysteria2's real port is stored in `PORT_HYSTERIA2`, default `8001`. Share links carry the range to clients through the `mport` parameter.

## Boot-time restore

NAT rules are lost on restart, so when port hopping is enabled the panel generates the boot-time restore unit `easysb-firewall.service`:

```ini
[Unit]
Description=EasySB Hysteria2 port-hopping firewall rules
After=network-online.target
Wants=network-online.target
Before=sing-box.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/easysb --apply-firewall

[Install]
WantedBy=multi-user.target
```

Key points:

- Type `oneshot` with `RemainAfterExit=yes`.
- `Before=sing-box.service` starts it before the core, so the rules are in place when the node comes up.
- It runs `easysb --apply-firewall`, a flag that only restores port-hopping rules for the boot unit to call.
- The unit is created only when Hysteria2 port hopping is in use, and not otherwise.

When removing port-hopping rules, the panel deletes the rules matching the current range and port; whether the protocol switch is on or off at the time, it tries to delete any rules that may exist, avoiding a stale redirect.

## Manual operation

The range and protocol switch are normally set under `Node Management` or `Service Management`, and the panel applies the rules and writes or removes the boot unit automatically. In a non-interactive environment the rules can be restored on their own:

```bash
# Restore only the port-hopping rules
easysb --apply-firewall
```

::: warning
Only configure these rules in a legally authorized network environment. Changing NAT rules affects all UDP traffic on the host, so verify the range and port.
:::
