---
title: 订阅
---

# 订阅

每个账号只有一个订阅地址，格式由访问它的客户端自动选择。地址形如：

```text
https://<域名>:8443/sub/<令牌>
```

订阅服务是面板本体的一部分（无交互模式 `easysb --serve`，由 `easysb.service` 承载），监听 `SUB_SERVE_PORT`（默认 `8443`）。它同时负责流量统计循环，不需要 nginx，也不做任何流量转发：sing-box 自己监听 WebSocket，订阅服务只负责下发配置。

## 一个地址，按客户端协商格式

订阅内容由请求的 User-Agent 决定，因此同一个地址可以同时给 sing-box、mihomo / Clash Meta 与 v2rayN 使用。匹配时统一转小写，命中顺序为 sing-box 优先、其次 Clash 系、其余落到 Base64 文档：

| User-Agent 标记 | 返回内容 | Content-Type |
| :--- | :--- | :--- |
| `sing-box`、`sfi/`、`sfa/`、`sfm/` | sing-box JSON 配置 | `application/json; charset=utf-8` |
| `clash`、`mihomo`、`stash`、`meta` | mihomo / Clash Meta YAML 配置 | `text/yaml; charset=utf-8` |
| 其余（v2rayN、passwall、passwall2、homeproxy、浏览器、`curl`、空） | Base64 分享链接文档 | `text/plain; charset=utf-8` |

Base64 文档是通用格式：v2rayN 直接导入，OpenWrt 上的 `passwall`、`passwall2`、`homeproxy` 会先对同一份文档做 Base64 解码再逐行解析。`luci-app-nikki` 使用 mihomo 内核，要求订阅含顶层 `proxies`，因此由 mihomo 配置提供。

User-Agent 认不出来时可以强制指定格式：

```text
https://<域名>:8443/sub/<令牌>?client=singbox
https://<域名>:8443/sub/<令牌>?client=mihomo
https://<域名>:8443/sub/<令牌>?client=v2ray
```

所有分享链接都保留带连字符的标准 UUID。`homeproxy` 会用 LuCI 的 `uuid` 校验节点，32 位无连字符形式会被判为无效。

## 响应头与用量上报

每次对 `/sub/<令牌>` 的成功响应都会带上用量头，Clash Verge Rev、Clash Orbit 与 v2rayN 可直接显示剩余流量与剩余天数：

```text
Subscription-Userinfo: upload=<字节>; download=<字节>; total=<字节>; expire=<unix 秒>
```

- `total=0` 表示不限流量。
- 账号永不过期时省略 `expire`，因为部分客户端把 `expire=0` 读成「已过期」。
- 另外带上 `Cache-Control: no-store`，因为文档内含账号凭据。

## 停用、过期与超额

账号状态是派生值，而非另存字段：停用（管理员关闭）、过期（`expire_at` 已过）、超额（`used_bytes >= quota_bytes`），否则为可用。请求命中这些状态时，服务返回 `403` 与纯文本原因（中英双语），而不是「没有节点」的半成品配置：

| 情况 | 响应 |
| :--- | :--- |
| 令牌不存在 | `404` |
| 账号停用 | `403`，`账号已停用 / account disabled` |
| 账号过期 | `403`，`账号已过期 / account expired` |
| 流量用尽 | `403`，`流量已用尽 / traffic quota exhausted` |
| 未启用任何协议 | `403`，`未为该账号启用任何协议 / no protocol enabled for this account` |

半成品配置会被 Clash 系解析器拒绝（空的 `proxies`）或让 sing-box 直接解析失败，因此拒绝比下发更安全。恢复（续期、重置流量、重新启用）会按相反方向生效。

## TLS 与明文

当域名下存在一份客户端可接受的真实证书时，订阅服务用该证书终结 TLS；否则以明文 HTTP 提供服务，并在面板中提示，因为订阅内容携带账号凭据。判断依据是 `cert.Usable`：自签占位证书不算，客户端会拒绝它。面板打印的地址与监听器加载的证书都问这同一个判断，所以客户端不会拿到一个监听器其实说 HTTP 的 `https://` 地址。

## 二维码与账号识别

面板为各客户端格式提供终端二维码（需安装 `qrencode`）。二维码载荷按客户端区分：

- sing-box 包装为深链 `sing-box://import-remote-profile?url=...`，这是它的扫码器所期望的形式。
- mihomo 与 v2rayN 使用纯订阅地址：Clash 系扫码器会把扫到的文本直接当作订阅 URL 抓取，`clash://install-config?url=...` 只在浏览器点击深链时有效。

订阅地址里的令牌即访问密钥，同时也是内核侧统计计数所使用的用户名。更换令牌会立刻让旧订阅地址失效，但已导入客户端的协议凭据不受影响，因此要收回访问权限需停用或删除该账号；重命名账号不会改变令牌，客户端导入无需重做。令牌与账号的关系见 [账号与流量](/config/users)。

## 统计间隔与配额重置

- 流量每 `SUB_SYNC_SECONDS`（默认 `300` 秒，最小 `30` 秒）采样一次：面板通过内置 gRPC 客户端调用 `StatsService/QueryStats`（`reset=true`），把增量累加到存储计数。内核计数器是进程内的，重启即清零，因此持久化的是增量。
- 配额按自然月重置：`last_reset` 进入新月份时，`used_bytes`、`upload_bytes`、`download_bytes` 归零。`quota_bytes: 0` 表示不限，`expire_at` 为零表示永不过期。
- 面板里的「重置已用流量」只清零存储计数；内核侧计数会在下一次 `QueryStats(reset=true)` 时被清零。

配额与有效期的管理在 [账号与流量](/config/users)；订阅服务的安装、重启与状态在「订阅管理」页面。
