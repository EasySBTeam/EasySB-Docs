---
title: 防火墙与端口跳跃
---

# 防火墙与端口跳跃

Hysteria2 端口跳跃对一段 UDP 端口区间做 DNAT，把落到区间内任意端口的流量重定向到 Hysteria2 的真实监听端口。默认区间为 `2080:3000`，目标是 `8001`。

## 规则

面板会检测可用的 NAT 后端，优先使用 `iptables`，否则使用 `nft`。对已启用的协议端口与订阅服务端口，还会在有 `ufw` 时用 `ufw allow`、在有 `firewalld` 时用 `firewall-cmd --add-port` 放行。

iptables 规则：

```bash
# 对 UDP 2080 到 3000 的入站流量做 REDIRECT
iptables -t nat -A PREROUTING -p udp --dport 2080:3000 -j REDIRECT --to-ports 8001
```

nftables 规则：

```bash
# 建立 nat 表与 prerouting 链
nft add table ip nat
nft 'add chain ip nat prerouting { type nat hook prerouting priority dstnat; }'

# 对 UDP 2080 到 3000 做 redirect
nft add rule ip nat prerouting udp dport 2080-3000 redirect to :8001
```

区间由 `HY2_HOP_RANGE` 保存，默认 `2080:3000`；Hysteria2 的真实端口由 `PORT_HYSTERIA2` 保存，默认 `8001`。分享链接会把区间以 `mport` 参数带给客户端。

## 开机恢复

NAT 规则重启即失效，因此启用端口跳跃时面板会生成开机恢复单元 `easysb-firewall.service`：

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

要点：

- 类型为 `oneshot`，并带 `RemainAfterExit=yes`。
- 通过 `Before=sing-box.service` 早于内核启动，保证节点起来时规则已就位。
- 执行 `easysb --apply-firewall`，该参数只负责恢复端口跳跃规则，供开机单元调用。
- 只有在使用 Hysteria2 端口跳跃时才会创建该单元；不使用时不创建。

移除端口跳跃规则时，面板会按当前区间与端口删除对应规则；无论协议开关当时是开还是关，都会尝试删除可能存在的规则，避免留下失效重定向。

## 手动操作

通常在「节点管理」或「服务管理」里设置区间与协议开关，面板会自动下发规则并写入/移除开机单元。无交互环境下可单独恢复规则：

```bash
# 仅恢复端口跳跃规则
easysb --apply-firewall
```

::: warning
只应在合法授权的网络环境中配置这些规则。修改 NAT 规则会影响该主机上所有 UDP 流量，请确认区间与端口无误。
:::
