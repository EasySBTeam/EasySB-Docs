---
title: 踩坑
---

# 踩坑与教训

本仓库已经踩过的陷阱。每条都给出症状与修法。

## 发布与 CI

- **强制推送不会触发 Actions。** 改写历史之后，即使分支移动了，`push` 工作流也可能不启动。用一次普通的后续提交与推送触发它。发布资产来自那次运行。
- **改写可能让旧 release 失联。** 改写某个 release tag 指向的提交，会让旧 tag/release 不可达（开始返回 404）。按当前标签方案重新发布。
- **更旧的运行会覆盖更新的资产。** 工作流使用带 `cancel-in-progress` 的 `concurrency` 组，使过期的构建无法覆盖更新的构建。
- **只保留最新 release。** `action-gh-release` 会覆盖同名资产但留下其他资产，所以发布作业先清理自己的资产，再删除其他每个 release 及其标签（`gh release delete --cleanup-tag`）。Release 页面应当只显示一个版本；残留的旧 release 意味着清理步骤没有运行。
- **Pages 需要 `.nojekyll` 与 `CNAME`。** GitHub Pages 默认运行 Jekyll，可能跳过 apt 树中的路径；没有 `CNAME` 文件的项目站点会挂在 `github.io` 下，而不是 `sb.kejizero.xyz`——而 `install.sh` 与软件源都固定指向后者。pages 作业在上传前把两者写进 `dist/repo`。
- **`Release` 文件必须在它自己的树之外生成。** `apt-ftparchive release .` 会校验套件目录下的每个文件，所以已经存在的 `Release` 会被列进它自己的校验和里。`index.sh` 先写临时文件，之后再移入。
- **pool 是共用的，所以 `Filename` 相对于站点根。** 两种架构与每个套件读取同一个 `pool/main/e/easysb/`；`Packages` 因此列出 `pool/main/e/easysb/easysb_6.0.0-1_amd64.deb` 这样的路径，而不是套件下的路径。`index.sh` 从一个镜像 pool 路径的临时树生成它，使字段保持站点根相对。
- **apt 源必须签名。** 当 `GPG_PRIVATE_KEY` 缺失时 pages 作业失败，而不是发布未签名索引：`install.sh` 写入 `signed-by=` 条目，apt 会拒绝索引未携带该密钥签名的源。
- **套件列表有两个家，且绝不能漂移。** Makefile 的 `APT_SUITES` 决定存在哪些 `dists/<suite>` 目录；`install.sh` 把 `/etc/os-release` 映射到同一批名字。新增发行版意味着两处都要改，否则机器会拿到一个未发布的源。

## 版本与身份

- **`/etc/os-release` 会遮蔽 `VERSION`。** 在旧 shell 中，source `/etc/os-release` 会覆盖脚本的版本变量。Go 构建用 `go:embed` 嵌入专门的 `VERSION` 文件，所以只有一个数字：没有需要与它保持同步的 `main.version` 回退。
- **只有一套标签方案。** 工作流、发布说明与 `internal/update` 都必须推导 `v<VERSION>`。某处硬编码标签会悄悄破坏更新检查，所以 `internal/update` 读取已发布的 `VERSION`，而不是钉死一个数字。

::: warning
`VERSION` 是唯一的版本来源。不要重新引入 `main.version` 默认值，也不要在 `install.sh` 里写版本常量。
:::

## sing-box 集成

- **二维码载荷因客户端而异。** sing-box 需要它的深层链接（`sing-box://import-remote-profile?url=...`，`subscribe.ImportScheme`）；裸 URL 不被识别，这正是之前破坏 sing-box 二维码扫描的原因。Clash 系客户端相反：其扫描器把解码后的文本交给 HTTP 客户端，所以 mihomo（以及 v2rayN）必须携带纯端点 URL。`clash://install-config?url=...` 链接只作为操作系统深层链接有效，从扫描的二维码永远不行。
- **AnyTLS 与 Hysteria2 URI 在查询前需要斜杠。** 发出 `anytls://pass@host:port?query` 会让客户端拒绝该链接；规范形式是 `anytls://pass@host:port/?query`。凭据还必须百分号编码（`url.User` / `url.UserPassword`），否则生成的密码里的 `@` 或 `/` 会截断 URI。生成的密码通过保持字母数字（`secret.Password`，字母表 `[A-Za-z0-9]`）来避免问题，这是所有目标解析器都接受的交集。OpenWrt 的 homeproxy 会丢弃包含 `%` 的 userinfo，所以标准 base64 密码（`+`/`/`/`=`）会悄悄丢失密码；保持字母数字可避免。
- **分享链接保留规范 UUID。** 发出 32 字符无连字符形式会让 homeproxy 通过其 LuCI `uuid` 校验把节点标为无效 UUID，尽管 sing-box 的 gofrs 解析器接受它。每个分享链接都保留带连字符形式。
- **Base64 文档是通用格式。** v2rayN 直接读取它；passwall、passwall2 与 homeproxy 先对它 base64 解码。不需要单独的「base」格式。`luci-app-nikki` 运行 mihomo 内核并按顶层 `proxies` 键校验，所以它需要 mihomo YAML 配置——同一个 `/sub/<token>` 端点在看到 Clash 系 User-Agent 时就会提供。
- **注释里的模板动作仍会被展开。** `text/template` 即使在 YAML/JSON 注释里也会执行模板动作。mihomo 头部注释里的 `.Proxies` 动作会把未注释的代理条目注入文档根之上，使配置无法解析。动作不要放进注释。
- **构建标签无法在运行时探测。** 这个二进制是否按账号统计流量取决于 `with_v2ray_api`，所以答案住在带标签的文件对里（`internal/sbcore/stats_on.go` / `stats_off.go`），部署路径在写 `experimental.v2ray_api` 之前询问 `sbcore.StatsCapable()`——内核会拒绝整个命名了它未构建的 API 的配置（`v2ray api is not included in this build`）。
- **`with_naive_outbound` 必须留在 `release/TAGS` 之外。** 上游的 `DEFAULT_BUILD_TAGS` 包含它，而它会拖入 cronet/Chromium 库，这些库需要 `with_purego` 且并非每个目标都有构建：照抄上游列表会破坏发布。面板的节点配置从不使用 naive outbound，所以标签集刻意更窄。
- **下载假定直连 GitHub。** 部署目标在海外，所以二进制与内核包下载直连 `github.com`。镜像前缀被刻意移除；不要为绕开本地网络问题而重新引入。
- **注释是扩展 JSON，不是标准 JSON。** `templates/` 文件是给人看的 JSONC；sing-box 的扩展解析器接受注释与合并字段，`sing-box check` 与 `easysb core check` 都能直接读取。面板渲染真实配置时会写出去注释后的标准 JSON。

### WireGuard 与 gVisor

```text
with_clash_api,with_quic,with_utls,with_v2ray_api,with_wireguard
```

这是 `release/TAGS` 的内容。它不包括 `with_gvisor`，所以 WireGuard 用户态栈不可用：`with_wireguard` 单独保留了端点类型与系统栈，而使用用户态栈的端点会报告 `gVisor is not included in this build`。面板自己的节点从不命名 WireGuard，所以这只影响手写的配置。

::: tip
构建标签只有 `release/TAGS` 一处定义。构建、测试与发布都读同一个文件；不要在 `go build` 命令行或工作流里另抄一份。
:::

## 工具链

- **Go 1.27.1。** `go.mod` 钉住工具链。设置 `GOTOOLCHAIN=auto` 时 Go 会自动下载它；CI 使用 `go-version-file: go.mod`。不要随意降低版本。
- **Charm v2 使用 vanity import 路径**（`charm.land/*`），而不是旧的 `github.com/charmbracelet/*` 模块路径。遵循现有 import。

## 状态与模板

- **两份订阅模板要同步。** 运行时使用嵌入的 `internal/subscribe/tun-fakeip.json`；`templates/config/tun-fakeip.json` 是可读镜像。只改一份会导致漂移。mihomo 模板对 `internal/subscribe/mihomo.yaml` 与 `templates/config/mihomo.yaml` 同理。
- **不要重命名状态键。** `easysb.conf` 与旧 shell 工具保持兼容；只加键，绝不改变用途。
- **重命名目录会牵动文档与 GitHub 元数据。** 文件夹改名必须更新 `README.md`、`README_ZH.md`、`CHANGELOG.md`、`.github/CODEOWNERS` 与 `.github/PULL_REQUEST_TEMPLATE.md`。

## 终端与测试

- **交互行为需要 PTY。** 一次性帧检查用 `--render --width W --height H`，它在没有 TTY 的情况下打印单帧。用它捕捉溢出与对齐回归。
- **图标假定 Unicode 终端，而非打过补丁的字体。** 默认符号集是普通等宽字体已经附带的一套单列几何字形；`--icons ascii`（或 `EASYSB_ICONS=ascii`）覆盖没有 Unicode 的终端。绝不要让布局依赖某个字形宽于一个字符。
- **鼠标上报会抢走点击拖拽选择。** 当任务/二维码界面为滚轮开启 `MouseModeCellMotion` 时，终端不再在拖拽时选择文本，用户无法按常规方式复制订阅 URL。该界面因此提供 `C`（把整段日志复制到 OSC52 剪贴板）与 `M`（释放鼠标，恢复原生选择）。如果在别处增加鼠标捕获，请提供同样的逃生口。
- **`git filter-branch` 之后 `refs/original/*` 仍在。** 它是改写前 refs 的本地备份。留着，或有意清理；不要推送它。

## 相关页面

- [架构](/dev/architecture)
- [设计](/dev/design)
- [约定](/dev/conventions)
- [构建与测试](/dev/build)
