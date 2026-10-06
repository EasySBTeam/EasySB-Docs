---
title: 构建与测试
---

# 构建与测试

入口都在 `Makefile` 里，用 `make help` 列出全部目标。裸 Go 命令同样可用，`make build` 只额外加上 `-trimpath`、`release/TAGS` 里的标签与提交戳。

## 常用命令

```bash
# 构建 ./easysb，标签来自 release/TAGS
make

# 提交前的完整关卡：gofmt -l + go vet + 带标签的测试
make check

# 交叉编译全部发布架构到 dist/
make dist

# 用 fpm 把 dist/ 的二进制打成 .deb
make deb

# 把 .deb 摆成签名的 apt 树（dist/repo）
make repo

# 渲染一帧桌面版式并退出，无需 TTY
make render

# 渲染所有页面并校验版式（需要 python3）
make screens

# 列出所有目标
make help
```

## `make check` 做了什么

`make check` 是提交前的关卡，等价于 `make lint test`：

- `gofmt -l .`：列出格式不一致的文件，非空即失败（目标 `fmt-check`）。
- `go vet` 跑两遍：一次带 `release/TAGS` 的标签，一次不带标签（目标 `vet`）。
- `go test -tags "$(TAGS)" ./...`：带发布标签运行测试（目标 `test`）。

单独运行各段：

```bash
# 就地格式化
make fmt

# 只做格式检查
make fmt-check

# 格式 + vet
make lint

# 不带标签运行测试，覆盖无流量统计的构建
make test-plain

# 带竞态检测运行测试
make test-race
```

## 裸 Go 等价命令

构建标签只有 `release/TAGS` 一处定义，所以命令行从该文件读取，而不是另抄一份：

```bash
# 构建二进制，标签取自 release/TAGS
go build -trimpath -tags "$(tr -d '[:space:]' < release/TAGS)" -o easysb .

# 不带标签快速构建
go build -trimpath -o easysb .

# 带标签运行全部测试
go test -tags "$(tr -d '[:space:]' < release/TAGS)" ./...

# 不带标签运行全部测试
go test ./...

# 带标签与无标签各跑一次 vet
go vet -tags "$(tr -d '[:space:]' < release/TAGS)" ./...
go vet ./...
```

`make version` 打印版本、提交、标签与 Go 版本，用于确认当前构建配置：

```bash
make version
```

## 内核子命令

sing-box 内核编译在这个二进制里，所以没有内核二进制要安装或切换。`core` 是唯一的子命令：

```bash
# 打印这个二进制携带的 sing-box 版本与能力
./easysb core version

# 用同一内核校验配置，只构建不启动
./easysb core check -c /etc/sing-box/config.json

# 以节点模式运行，服务单元的 ExecStart 使用的就是这条
./easysb core run -c /etc/sing-box/config.json
```

`core check` 与 `core run` 都走 `internal/sbcore`，使用上游命令行相同的注册表集合，所以面板接受的配置就是 `sing-box` 自身接受的配置。部署路径在重启节点之前先跑 `Check`。

## 构建标签

构建标签决定二进制能表达什么，因此属于产品而不是构建细节。它们存放在 `release/TAGS`，一行，被 Makefile 与发布工作流共读：

```text
with_clash_api,with_quic,with_utls,with_v2ray_api,with_wireguard
```

这一组刻意比上游的 `release/DEFAULT_BUILD_TAGS` 更窄：面板只携带它的节点与它分发的配置真正命名的东西。`with_v2ray_api` 需要用于按账号字节计数，并且以带标签的文件对体现（`internal/sbcore/stats_on.go` / `stats_off.go`），部署路径在写 `experimental.v2ray_api` 之前询问 `sbcore.StatsCapable()`。更多细节见 [内核构建](/config/core-builds)。

::: warning
不要照搬上游的标签列表。`with_naive_outbound` 会拖入 cronet/Chromium 库，并非每个发布架构都能构建；只添加在 `linux/amd64` 与 `linux/arm64` 两个发布构建中验证过的标签。
:::

## 无 TTY 渲染

交互行为需要 PTY，但版式检查不需要。`--render` 打印单帧后退出，适合在没有 TTY 的环境里捕捉溢出与对齐回归：

```bash
# 渲染一帧，指定宽高
./easysb --render --width 100 --height 40

# 渲染指定界面：栏目 id、system、task、toolbox-report 或 bbr 相关界面
./easysb --render --screen system --width 100 --height 40
```

`make render` 是 `./easysb --render --width 100 --height 40` 的快捷方式；`make screens` 会渲染所有页面并断言版式。

## 架构与打包

发布只覆盖 Debian 与 Ubuntu 实际在用的两种服务器架构，即 `amd64` 与 `arm64`（BBR 内核覆盖的两个）。资产名到 Go 目标三元组、以及到 Debian 架构名的映射都只在 Makefile 中定义一次（`GOARCH_*` 与 `DEBARCH_MAP`），`dist` 与打包共用。`pkg-stage` 在进入暂存树时用 UPX 压缩二进制，所以发布资产与 apt 源携带相同字节。打包的分区与单元生成见 [架构](/dev/architecture)。

## 相关页面

- [架构](/dev/architecture)
- [设计](/dev/design)
- [约定](/dev/conventions)
- [踩坑](/dev/pitfalls)
- [内核构建](/config/core-builds)
- [运行时路径](/config/paths)
