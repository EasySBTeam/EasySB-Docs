---
title: 约定
---

# 约定与偏好

## 命名

- 仓库下的目录为小写 ASCII：`templates/`、`docs/`、`assets/`。模板子目录同样如此（`anytls`、`hysteria2`、`tuic`、`vmess-websocket-tls`、`vless-vision-reality`、`config`）。
- Go 包保持小写单词（`state`、`subscribe`、`sysinfo`）。接口与存储以它们建模的东西命名，而不是以界面屏幕命名：账号模型是 `internal/user` 加一个 `Store`，面板里把它标为「账号与流量」。
- 协议显示名在正文里保留品牌大小写（`AnyTLS`、`Hysteria2`、`TUIC v5`），而协议键与路径为小写。

## 语言

- `README.md` 是英文，也是默认文档。
- `README_ZH.md` 是中文翻译。两者保持同步；一个功能只有在两者都描述之后才算完成。
- 代码标识符、注释、非平凡代码的提交标题，以及这些文档都用英文。面向用户的界面字符串通过 `internal/i18n` 双语化，只有一个刻意的例外：工具箱自己的报告正文。工具的列标签、摘要与备注就是工具自己的措辞，因为在一次测量与其标签之间插入翻译层，正是数字挂到错词下的地方。面板措辞与工具措辞的划分见 `docs/toolbox.md`。

## 版本

- `VERSION` 保存程序版本，目前是 `X.Y.Z` 形式。
- `VERSION` 是这个数字被写下的唯一地方：它用 `go:embed` 嵌入，`install.sh` 从不需要它，因为 apt 自己解析软件包。不要添加 `main.version` 默认值或脚本常量。
- 程序版本独立于 sing-box 内核版本。
- 发布标签是 `v<VERSION>`，发布名也是同一个字符串。工作流、`internal/update` 与发布说明都从版本推导标签；不要创建第二套命名方案。只保留最新一次发布：工作流在每次发布后清理更旧的 release 与其标签。
- 发布资产是每个架构一个 `.deb`，即 `easysb_<version>-1_<arch>.deb`，其中 `<arch>` 用 Debian 拼写（`amd64`、`arm64`），`-1` 是软件包自身的修订号。`dist/easysb-linux-<asset>` 是中间产物，绝不单独发布。
- apt 源就是 GitHub Release 本身，所以一条命令的 `install.sh` 只有一个固定地址（`https://github.com/EasySBTeam/EasySB/releases/latest/download`）可指向。该目录带有 `install.sh` 本身，所以这一条命令（`curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash`）无需第二个地址。它是一棵扁平（"trivial"）apt 仓库：所有文件同处一层（`Packages` 与签名的 `Release` / `InRelease` / `Release.gpg`、公钥 `easysb-archive-keyring.asc`、`install.sh` 与各架构一个 `.deb`），因此没有 `dists/<suite>` 分层。`make repo` 构建并签名它（`apt-ftparchive`），发布作业把它附到 release。一份包服务所有发行版；`install.sh` 仍会把 `/etc/os-release` 映射到受支持的 Debian / Ubuntu 版本，仅用于拒绝我们不发布的版本。

## 提交

- 使用约定式提交：`type(scope): subject`，例如 `fix(tui): 收束底部空行` 或 `test(update): 覆盖发布 tag 推导`。
- 标题保持一行。当原因不明显时，在正文里解释。
- 不要添加共同作者 trailer。

## 代码

- 提交前运行 `gofmt`；代码树必须 gofmt 干净。
- 推送前运行 `go vet ./...` 与 `go test ./...`。
- 优先使用单一职责的小包，并在包与导出标识符上写文档注释。
- 避免复述代码的注释；注释留给意图与坑点。

## 测试

- 单元测试与代码同目录，命名为 `*_test.go`。
- TUI 有一条渲染冒烟路径：`--render --width W --height H` 打印一帧，这让溢出与对齐回归在没有 TTY 的情况下可测。
- 解析与映射逻辑优先使用表驱动测试。

## 发布

- `.github/workflows/easysb-go-release.yml` 交叉编译 `linux/amd64` 与 `linux/arm64`（BBR 内核覆盖的两个架构），在被监视路径发生改动并推送到 `master` 时运行，并发布一个以 `v<VERSION>` 标记和命名的 release，每个架构携带一个 `.deb`。随后发布作业清理更旧的 release 与其标签，所以 Release 页面只显示当前版本。
- `.deb`（`make deb`）由 fpm 从一棵暂存树构建；架构名位于 Makefile 的 `DEBARCH_MAP`，以资产名为键，一张表同时服务打包与布局。`pkg-stage` 在进入暂存树时用 UPX 压缩二进制，所以发布资产与 apt 源携带相同的压缩后字节。打包的单元来自 `easysb --print-unit`；不要在 `packaging/` 下手写单元。
- `make repo`（`packaging/repo/index.sh`，经由 `apt-ftparchive`）把 `.deb` 摆成扁平 apt 仓库并签名。发布作业把 `dist/repo/*` 附到 release，release 即软件源根；`packaging/repo/` 是决定布局的唯一地方。
- apt 索引由一把口令保护的密钥签名：secrets 是 `GPG_PRIVATE_KEY` 与 `GPG_PASSPHRASE`，签名从 0600 文件读取口令，因此它不会出现在进程列表里。发布作业要求 `GPG_PRIVATE_KEY`，缺失即失败，因为未签名的源是 `install.sh` 绝不该让一台机器指向的东西。
- 强制推送之后，用一次普通推送触发工作流；强制推送不能可靠地产生 Actions 的 `push` 事件。

## 文档卫生

- 结构性或行为性改动要更新 `CHANGELOG.md` 的 `## [Unreleased]` 段，发布时把条目移到版本标题下。
- 布局或核心决策变化时保持 `docs/` 最新。

## 相关页面

- [架构](/dev/architecture)
- [设计](/dev/design)
- [踩坑](/dev/pitfalls)
- [构建与测试](/dev/build)
