---
title: 支持的协议
---

# 支持的协议

EasySB 在同一台机器上一次编排五个 sing-box 协议。每个协议有默认端口，安装时逐一询问；每个账号在每个协议上有独立凭据，而节点只保留不属于任何账号的材料（Reality 密钥对）。

| 协议 | 承载 | 默认端口 | 伪装 / 加密 | 需要域名与证书 |
| :--- | :--- | :--- | :--- | :--- |
| AnyTLS | TCP + TLS | 8000 | 证书 TLS | 是 |
| Hysteria2 | QUIC / UDP | 8001 | TLS（ALPN `h3`） | 是 |
| TUIC v5 | QUIC / UDP | 8002 | TLS（ALPN `h3`） | 是 |
| VLESS + Vision + Reality | TCP | 8003 | REALITY（免证书） | 否 |
| VMess + WebSocket + TLS | WS over TLS | 8004 | 证书 TLS | 是 |

除 VLESS + Reality 外，其余协议都需要一个已解析到本机的域名与一份有效证书。证书的申请与续期见 [证书](/features/certificates)。

## 端口编排

五个端口在部署时逐一询问，规则一致：

- 直接回车取该协议的默认端口。
- 输入 `r` 取一个随机端口。
- 输入数字手动指定端口。
- 与已分配端口冲突时会提示重新设置。

端口与协议开关保存在 `/etc/sing-box/easysb.conf`（`PORT_*` 与 `IS_*`）。实际服务端配置由面板渲染到 `/etc/sing-box/config.json`。

## 逐协议说明

### AnyTLS（8000 / TCP + TLS）

- 承载：TCP，外层为标准 TLS。
- 抗指纹：`padding_scheme` 多阶段填充，通过改变初始数据包大小与交互节奏对抗流量特征分析。
- ALPN 提供 `h3`、`h2`、`http/1.1`，模拟正常 HTTPS 协商。
- 账号凭据：`password`。
- 需要域名与证书。

### Hysteria2（8001 / QUIC）

- 承载：QUIC（UDP），基于 TLS，ALPN 固定为 `h3`。
- 关键能力：弱网与高丢包场景表现优秀；支持端口跳跃。
- 节点级参数：`up_mbps` / `down_mbps` 是整个节点的带宽估算，不按账号区分。
- 账号凭据：`password`。
- 需要域名与证书。

端口跳跃会为 UDP 端口区间下发 DNAT 规则，详见 [防火墙与端口跳跃](/features/firewall)。

### TUIC v5（8002 / QUIC）

- 承载：QUIC（UDP），基于 TLS，ALPN 为 `h3`。
- 关键能力：支持 0-RTT 快速握手与 `native` UDP 转发，延迟低。
- 拥塞控制默认 `bbr`。
- 账号凭据：`uuid` 与 `password` 同时使用。
- 需要域名与证书。

### VLESS + Vision + Reality（8003 / TCP）

- 承载：TCP，外层为 REALITY，不申请也不使用证书。
- 关键能力：`xtls-rprx-vision` 流控消解双重 TLS 握手与数据包长度特征；抗主动探测。
- 伪装目标：默认偷用 `apple.com`，握手回源到 `apple.com:443`。
- 账号凭据：`uuid`。
- 不需要域名，也不需要证书。

Reality 的密钥对属于节点而非账号：`REALITY_PRIVATE`、`REALITY_PUBLIC`、`REALITY_SHORT_ID` 由部署时生成并保存在节点状态里，客户端分享链接使用 `pbk`（公钥）与 `sid`（Short ID），私钥只在服务端。

::: warning
`REALITY_PRIVATE` 只应留在服务端。它一旦泄露，伪装即可被冒用。仓库模板里的私钥是示例值，部署前必须替换。
:::

### VMess + WebSocket + TLS（8004）

- 承载：WebSocket over TLS，WebSocket 路径为 `/vmess`。
- 关键能力：可穿 CDN 与反向代理；支持 Early Data（`max_early_data` 2048，由 `Sec-WebSocket-Protocol` 头承载）。
- 账号凭据：`uuid`。
- 需要域名与证书。

## 账号凭据与节点材料

账号存储 `/etc/sing-box/easysb-users.json` 是唯一凭据来源。每个账号在每个协议上拥有独立凭据，字段按协议需要区分：

| 协议 | 凭据字段 |
| :--- | :--- |
| AnyTLS | `password` |
| Hysteria2 | `password` |
| TUIC v5 | `uuid` + `password` |
| VLESS + Reality | `uuid` |
| VMess + WS + TLS | `uuid` |

凭据在协议被选中时生成，取消选中时保留，因此重新选中不会让客户端已有的导入失效。节点的 `users` 数组与 `stats.users` 都来自同一份可路由账号集合，停用、过期或超额的账号会从内核配置中移除。账号的限额、有效期与令牌管理见 [账号与流量](/config/users)。

## 模板与校验

`templates/` 下的协议样例是可直接阅读的 JSONC；去掉注释后即可作为 sing-box 服务端或客户端配置。运行订阅所用的模板以 `go:embed` 方式内嵌在 `internal/subscribe/`，与 `templates/config/` 下的可读镜像成对维护。模板清单见 [配置模板](/config/templates)。

内核已编译进面板，因此校验配置不需要额外安装 sing-box：

```bash
# 用面板内编译的引擎校验一份服务端配置
easysb core check -c /etc/sing-box/config.json

# 查看本二进制携带的内核版本与是否带流量统计
easysb core version
```

内核的构建标签、`with_quic` / `with_utls` / `with_v2ray_api` 的作用见 [内核构建](/config/core-builds)。
