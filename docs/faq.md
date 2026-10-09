---
title: 常见问题
---

# 常见问题

下面的问题与答案都来自项目的工程文档与实现，用于解释最常遇到的疑问。

## 为什么内核要编译进面板？

sing-box 是 `go.mod` 的直接依赖，编译进面板本体。节点就是面板以节点模式启动，即 `easysb core run -c /etc/sing-box/config.json`。这样做带来两个结果：没有内核二进制需要下载、替换或切换，装上面板就等于装好了内核；`easysb core check` 用将来真正服务节点的同一套引擎校验配置，部署路径重启服务前跑的就是它。

面板的版本行会如实显示内核版本以及本次构建能否统计流量。能否统计取决于构建标签 `with_v2ray_api`（定义在 `release/TAGS`），面板读 `sbcore.StatsCapable()` 而不是假定，因此不带该标签的构建照常部署可用节点，只是不计流量。

## 如何只停用一个账号而不影响其他人？

每个账号在启用过的每个协议上都有自己的凭据。要收回某人的访问权限，在 `账号与流量` 里停用或删除该账号，其余账号的凭据完全不受影响；停用或删除会让该账号从内核配置中移除。

更换令牌会立刻让旧订阅地址失效，但已导入客户端的协议凭据仍然有效，因此单独更换令牌不会收回访问权限。重命名账号不会改变令牌，客户端导入无需重做。

## 订阅为什么返回 403？

订阅服务对停用、过期或超出流量的账号返回 `403` 与纯文本原因，而不是返回一份没有节点的半成品配置。原因是空节点列表对 Clash 系客户端来说无法解析，一份解析不了的配置比一个明确的错误更难排查。

返回 403 时，响应仍带着 `Subscription-Userinfo` 头，客户端因此可以显示已用流量与到期时间。这类账号会在下一个统计周期从内核配置中移除。

## 为什么订阅令牌同时是统计用的用户名？

sing-box 的 V2Ray 计数键形如 `user>>><name>>>traffic>>>...`，这个名字既聚合计数，又会作为 `QueryStats` 的正则模式使用。令牌是随机 ASCII 字符串，构造上唯一、重命名后保持不变，不会包含正则元字符；显示名可能是中文或含正则元字符，不适合承担这个角色。

出于同样的原因，入站的 `users` 数组与 `stats.users` 必须来自同一个判定来源（`user.Store.Routable`），否则一个账号可能通过了认证却永远不计流量。

## 需要安装 nginx 吗？

不需要。订阅由内置服务 `easysb --serve` 提供，以 `easysb.service` 运行，在 `SUB_SERVE_PORT`（默认 `8443`）上响应 `/sub/<令牌>`。它按 User-Agent 协商返回格式，域名下存在真实证书时自行终结 TLS，并能在响应里上报用量。

旧版本中的 nginx 静态订阅站点已经被移除，也没有单独的 nginx 配置片段需要维护。

## 没有域名怎么办？

VLESS + Vision + Reality 不依赖证书，不需要域名，可以只用它部署一台节点。其余四个协议基于标准 TLS，需要一个已解析到本机且能签发有效证书的域名。

如果通过 CDN 代理（例如 Cloudflare 的小黄云），HTTP-01 校验会由 CDN 应答而无法到达本机，签发会失败。面板在申请前会做解析预检并提示这一点。

## 无终端环境怎么使用？

面板的很多能力有不依赖 TTY 的入口：

| 命令 | 用途 |
| :--- | :--- |
| `sb --tool list` | 列出工具箱全部条目 |
| `sb --tool <id>` | 运行某一项并输出纯文本表格 |
| `sb --unlock` | 一次跑完 17 项解锁检测并输出报告 |
| `sb --provision <清单>` | 按 JSON 清单完成整台部署并打印订阅地址（`-` 表示从标准输入读取） |
| `sb --render --width W --height H` | 渲染一次仪表盘后退出，可加 `--screen <id>` 渲染子页面 |
| `easysb core check -c <配置>` | 用编译进来的引擎校验节点配置 |
| `easysb core version` | 打印本二进制携带的内核版本与能力位 |

其中 `sb --provision` 把节点、证书与账号一次做完，清单格式与用法见 [无终端部署](/guide/provision)。用于开机单元的入口也遵循同样原则，例如 `--apply-firewall` 加载状态、应用规则、写下单元后立即退出，全部不需要 TTY。

## 怎么切换语言和界面外观？

首次启动会在首屏询问语言，选定后写入 `/etc/sing-box/easysb-ui.conf`，下次直接进入菜单。命令行可以预设：

```bash
sb --language E --skin graphite --theme dark --icons ascii
```

| 参数 | 取值 |
| :--- | :--- |
| `--language` | `C`（中文）或 `E`（英文） |
| `--skin` | `jade`（默认）、`aurora`、`ember`、`graphite`，也可用 `a` 到 `d` |
| `--theme` | `auto`（默认）、`dark`、`light` |
| `--icons` | `symbols`（默认）或 `ascii` |

也可以在 `系统信息` 页里直接改：`A` 到 `D` 或 `↑`/`↓` 加 `Enter` 选皮肤，`T` 切深浅配色，`I` 在 Unicode 符号与纯 ASCII 之间切换，`L` 切语言。改动下一帧生效。

## gVisor 与 WireGuard 用户态是什么情况？

`release/TAGS` 中不包含 `with_gvisor`，但包含 `with_wireguard`。因此 WireGuard 的系统协议栈可用，而用户态协议栈依赖 gVisor，使用它会得到 `gVisor is not included in this build` 的提示。

面板自己的节点配置从不使用 WireGuard，所以这只影响手写的客户端或服务端配置，不影响面板部署出的节点。

## 升级是怎么做的？

升级走系统包管理，不涉及自替换运行中的二进制。配置好 apt 源后，`sudo apt upgrade` 即可把 `easysb` 升级到最新版本。

面板里的 `版本更新` 入口会读取公开发布的 `VERSION`，据此推导出 `v<VERSION>` 标签，再通过 apt 升级 `easysb` 包，完成后提示重启面板。程序版本由 `VERSION` 唯一决定，并用 `go:embed` 编译进二进制，因此裸 `go build` 与发布版报告同一个版本号。

## 内核版本和程序版本是什么关系？

两者相互独立。程序版本写在 `VERSION` 里，发布 tag 统一派生为 `v<VERSION>`；内核版本来自 `go.mod` 中当前声明的 sing-box 发行版（当前为 `v1.14.2`）。

`easysb core version` 会同时打印程序版本、内核版本与构建是否可以统计流量。版本行也以 `1.14.2 · 带流量统计` 这样的形式显示。

## 订阅服务为什么有时用明文 HTTP？

订阅服务只有在域名下存在客户端会接受的真实证书时才终结 TLS。自签占位证书不算数，客户端会拒绝它。没有可用证书时，服务退回明文 HTTP，面板会明确提示，因为订阅内容包含账号凭据。

输出给用户的地址与监听实际使用的协议来自同一个判定（`cert.Usable`），因此不会出现打印 `https://` 却监听明文 HTTP 的情况。

## 配置文件都在哪里？

| 路径 | 内容 | 权限 |
| :--- | :--- | :--- |
| `/etc/sing-box/config.json` | 渲染出的服务端配置，包含与账号库相同的凭据 | `0600` |
| `/etc/sing-box/easysb.conf` | 节点状态，与旧版 shell 工具兼容的 KV 布局 | `0600` |
| `/etc/sing-box/easysb-users.json` | 账号库，唯一的凭据来源 | `0600` |
| `/etc/sing-box/easysb-ui.conf` | 界面偏好（皮肤、配色、标记、语言） | `0644` |
| `/etc/sing-box/acme/` | ACME 账户与证书，可用 `EASYSB_ACME_DIR` 覆盖 | 账户与私钥 `0600` |

`config.json` 之所以是 `0600`，是因为它带有与账号库相同的可用凭据。状态键保持与旧版 shell 工具兼容：只新增键，不重命名或改变既有键的含义。

## 证书续期是怎么工作的？

证书由面板进程内的 lego 通过 HTTP-01 standalone 方式签发与续期。续期判定按本地叶证书的到期时间进行，提前 30 天开始处理，由面板自己安装的 `easysb-acme.timer` 驱动，执行 `easysb --renew-certs`。

续期只会在确实续下新证书时重载 sing-box 与订阅服务，因此每天一次的定时运行不会平白断掉连接。校验过程需要 80 端口空闲，面板会在尝试前先停内核腾出端口。

## 为什么工具箱里没有 geekbench 或 fio？

工具箱的设计前提是面板不下载任何外部程序。CPU、内存与磁盘的跑分是面板自己的 Go 负载，测速使用 speedtest.net 的库在进程内运行，解锁检测只是若干 HTTP 请求。

因此那些本质上依赖外部程序的条目按设计不做，包括 geekbench、sysbench、fio 以及 mtr / nexttrace。面板自己的跑分只适合在同一面板的不同主机之间互相比较，它们不等同于 geekbench 或 fio 的分数。

## 端口跳跃的规则重启后会消失吗？

不会。iptables 与 nftables 的 DNAT 规则本身不跨重启存活，因此面板会生成 `easysb-firewall.service`。这是一个 oneshot 单元，在 `sing-box.service` 之前通过 `easysb --apply-firewall` 恢复规则。不使用 Hysteria2 端口跳跃时不会创建该单元。
