---
title: 内核构建
---

# 内核构建

`github.com/sagernet/sing-box` 是本 module 的依赖。内核不再是一个文件：版本是 `go.mod` 里的一行，节点就是用节点模式启动的这个二进制，主机上没有任何内核要下载、安装、解包或切换。

```text
go.mod                        github.com/sagernet/sing-box v1.14.2
internal/sbcore               引擎：run、check、version、构建能力
/etc/systemd/system/sing-box.service
                              ExecStart=/usr/bin/easysb core run -c /etc/sing-box/config.json
easysb core run -c <config>   节点
easysb core check -c <config> 同一套引擎，构建配置后再关掉
easysb core version           本二进制携带的内核版本与能力
```

`internal/sbcore.Run` 用将来真正服务节点的同一个库构建配置、启动实例，并阻塞到服务管理器结束进程；`Check` 是做同样的构建但不 `Start`，这正是部署路径在重启节点前跑的一步。两者都经过 `include.Context`，也就是上游命令行使用的注册表集合，因此面板接受的配置，`sing-box` 本身也会接受。

## 节点与命令

节点由 `sing-box.service` 拉起，执行的命令是：

```bash
# 节点模式：启动内核并阻塞在服务里
easysb core run -c /etc/sing-box/config.json
```

两个辅助子命令：

```bash
# 用携带的引擎校验一份配置，不启动节点
easysb core check -c /etc/sing-box/config.json

# 打印本二进制携带的内核版本与流量统计能力
easysb core version
```

`core` 是唯一的子命令。把配置写好并校验通过，是面板重启节点前的固定步骤。

## 构建标签

构建标签决定二进制能表达什么，因此它是产品的一部分，而不是构建细节。标签只有一处定义，写在 `release/TAGS`，由 `Makefile` 与 `.github/workflows/easysb-go-release.yml` 共同读取：

```text
with_clash_api,with_quic,with_utls,with_v2ray_api,with_wireguard
```

每个标签都有明确用途：

| 标签 | 用途 |
| :--- | :--- |
| `with_quic` | Hysteria2 与 TUIC 入站；缺失时内核会拒绝整份包含 QUIC 协议的节点配置 |
| `with_utls` | Reality 入站；缺失时 Reality 无法构建 |
| `with_v2ray_api` | 按账号统计字节数，也就是 `账号与流量` 的流量列 |
| `with_clash_api` | 订阅文档中命名的 Clash 兼容 API 块 |
| `with_wireguard` | 命名 WireGuard 端点的配置 |

这个集合比上游的 `release/DEFAULT_BUILD_TAGS` 刻意更窄：面板只携带它的节点与它下发的配置真正会用到的能力。每个被保留的标签都在两个发布构建（`linux/amd64` 与 `linux/arm64`）上验证过。

上游还带有、但面板有意省略的标签：`with_acme`（面板的证书来自 `internal/cert`，由它自己与 CA 通信）、`with_dhcp`、`with_gvisor` 与 `with_tailscale`。它们只增加体积，因为面板运行的节点并不命名这些能力。`with_naive_outbound` 同样省略：它会拖入 cronet / Chromium 库，而它们在每个发布架构上都没有可用的构建。

有一个后果值得知道：WireGuard 的用户态栈由 gVisor 支撑，因此只带 `with_wireguard` 时保留端点类型与系统栈，而用户态栈端点会报 `gVisor is not included in this build`。面板自己的节点从不命名 WireGuard，所以这只影响手写的配置。

## 流量统计能力是一对文件

**`with_v2ray_api` 是那个关键的标签**：它是 sing-box 按账号统计字节数的唯一途径，也就是 `账号与流量` 里流量列的数据来源。标签无法在运行时探测（编译进去就是编译进去，没带就是没带），因此这个能力被实现为一对文件，而不是运行时检查：

| 文件 | 标签 | `sbcore.StatsCapable()` |
| :--- | :--- | :--- |
| `internal/sbcore/stats_on.go` | `with_v2ray_api` | `true` |
| `internal/sbcore/stats_off.go` | `!with_v2ray_api` | `false` |

部署路径在写 `experimental.v2ray_api` 之前先问它：内核会拒绝一份命名了它不具备的 API 的完整配置（`v2ray api is not included in this build`），所以不带该标签的构建必须省略这个块。这样的构建仍能部署出可用的节点，面板会在部署日志里说明，统计循环也会跳过采样，而不是每个周期都对着无人监听的套接字报错。发布构建始终带这个标签，只有不带 `-tags` 的开发者构建不带。

## QUIC 的拒绝信息

**`with_quic` 是另一个会以内核原话暴露的标签**。Hysteria2 与 TUIC 是 QUIC 协议，不带该标签的构建会拒绝任何包含其一的配置：

```text
QUIC is not included in this build, rebuild with -tags with_quic
```

部署路径会把内核的原话记进日志然后停下，这是诚实的失败，但不是一个可用的节点。`release/TAGS` 带上了它，所以这只影响手写的构建。`internal/deploy` 的测试也按同样方式拆分：五协议文档放在 `with_quic` 标签之后，另有一份所有构建都接受的文档，加上带标签的验收测试。

## 运维看到什么

面板里没有 `内核管理` 分区：一个面板无法管理装在它内部的内核。版本显示在面板自身版本所在的位置（系统卡片以及每页的版本行），读作：

```text
1.14.2 · 带流量统计
```

其中的 `带流量统计` / `无流量统计` 就是 `StatsCapable()`，与部署路径使用的是同一个事实，因此标签不会与节点实际行为相矛盾。原先打开 `内核管理` 的菜单项现在打开 `工具箱`，也就是那个测量工具箱，回答 VPS 运维真正会问的问题：这个 IP 能用哪些服务、回程路由长什么样、这台机器有多快，见 [工具箱](/features/toolbox)。

`internal/sbcore.Version` 优先使用发布时写入的版本戳（`-X github.com/sagernet/sing-box/constant.Version=…`），回退到依赖的 module 版本，因此本地构建与发布版报告同一个数字。

## 相关

- [架构](/dev/architecture)
- [配置模板](/config/templates)
- [账号与流量](/config/users)
- [运行时路径](/config/paths)
