---
title: 配置模板
---

# 配置模板

`templates/` 是仓库里可直接阅读的 JSONC 参考材料：五个协议的客户端 / 服务端样例，以及两份订阅模板。它们既可以用作文档来对照字段，也可以在去掉注释后直接作为 sing-box 配置使用。运行时真正嵌进面板的订阅模板只来自 `internal/subscribe/`，两者是一对镜像。

## 协议样例

每个协议目录都含一对文件：`config_server.json` 描述服务端入站，`config_client.json` 描述对应客户端。它们用注释逐行解释字段，去注释后即为合法 sing-box 配置。

| 目录 | 协议 | 承载层 | 伪装 / 加密 | 关键能力 |
| :--- | :--- | :--- | :--- | :--- |
| `templates/anytls/` | AnyTLS | TCP | 证书 TLS | Padding Scheme 多阶段填充 |
| `templates/hysteria2/` | Hysteria 2 | QUIC / UDP | TLS（ALPN `h3`） | 端口跳跃、弱网表现优秀 |
| `templates/tuic/` | TUIC v5 | QUIC / UDP | TLS（ALPN `h3`） | 0-RTT 握手、`native` UDP 转发 |
| `templates/vmess-websocket-tls/` | VMess | WebSocket over TLS | 证书 TLS | 可穿 CDN、Early Data |
| `templates/vless-vision-reality/` | VLESS + Vision | TCP | REALITY（免证书） | `xtls-rprx-vision`、抗主动探测 |

每个目录下的文件命名一致：`config_server.json` 与 `config_client.json`。服务端样例展示内核如何接收连接，客户端样例展示同一套凭据如何在客户端侧声明。

## 订阅模板

`templates/config/` 下的两份文件是订阅内容的可读镜像，一份对应 sing-box JSON，一份对应 mihomo / Clash Meta YAML。

| 文件 | 面向客户端 | 内容 |
| :--- | :--- | :--- |
| `templates/config/tun-fakeip.json` | sing-box（SFM / SFA / SFI） | TUN + FakeIP：规则分流、DNS 拆分、URLTest 自动测速 |
| `templates/config/mihomo.yaml` | mihomo / Clash Meta、`luci-app-nikki` | 完整客户端配置：节点、策略组、DNS、分流规则 |

订阅服务按请求的 User-Agent 在这两种格式与 Base64 分享链接之间选择，细节见 [订阅](/features/subscription)。模板里的节点、凭据与节点名由面板按账号渲染，不是固定值。

## 可读镜像与运行时副本

`templates/` 只作参考；运行中的面板不读这两个目录。真正被打进二进制的是 `internal/subscribe/` 下的同名文件，通过 `//go:embed` 嵌入：

```text
templates/config/tun-fakeip.json   <->   internal/subscribe/tun-fakeip.json
templates/config/mihomo.yaml       <->   internal/subscribe/mihomo.yaml
```

修改其中一份时，另一份必须同步更新，否则文档与面板实际下发的内容会漂移。可读镜像里出现的是带样例数据的渲染结果，嵌入模板里则是 `text/template` 动作与占位符。

::: tip 关于 JSONC
`templates/` 里的 JSON 允许注释，因为它是给人读的；sing-box 自身解析时也接受注释与尾随逗号。面板渲染真实配置时会写出去注释后的文档。
:::

运行中的节点配置 `/etc/sing-box/config.json` 由 `internal/config` 根据节点状态与账号渲染，而不是这些样例的复制品。要理解账号与凭据如何进入配置，见 [账号与流量](/config/users)。

## 示例值必须替换

::: danger 模板中的示例凭据不可用于生产
样例里的 UUID、密码、REALITY 私钥 / 公钥、Short ID 与证书路径全部是示例值。直接部署等同于无防护，必须重新生成并保证服务端与客户端严格一致。
:::

需要重新生成的材料包括：

- 认证字段：`templates/anytls/config_server.json` 与 `templates/hysteria2/config_server.json` 的 `password`，`templates/tuic/config_server.json` 的 `uuid` + `password`，`templates/vless-vision-reality/` 与 `templates/vmess-websocket-tls/` 的 `uuid`。
- REALITY 材料：`private_key` 只应存在于服务端，`short_id` 与客户端保持一致。
- 证书路径：样例写成 `/root/fullchain.cer` 与 `/root/private.key`，实际部署应指向面板签发并收紧权限后的文件，证书私钥权限为 `600`。

面板部署流程会为每个账号生成独立凭据，因此手工替换只针对「只用模板」的场景。

## 校验模板

下配置前用内核校验语法，命令只检查构建与解析，不会启动节点：

```bash
# 校验 VLESS + Vision + Reality 服务端样例
sing-box check -c templates/vless-vision-reality/config_server.json
```

也可以让面板内编译进来的同一套引擎校验，得到的结果与将来真正服务节点的引擎一致：

```bash
# 用面板携带的内核校验（与节点是同一套引擎）
easysb core check -c templates/vless-vision-reality/config_server.json
```

内核构建所携带的能力见 [内核构建](/config/core-builds)；如果样例用到了未携带的协议，校验会直接失败。

## 相关

- [支持的协议](/features/protocols)
- [订阅](/features/subscription)
- [账号与流量](/config/users)
- [内核构建](/config/core-builds)
