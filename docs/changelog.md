---
title: 更新日志
---

# 更新日志

本页记录 EasySB 的重要里程碑，按版本从新到旧排列。项目只保留最新的 Release，完整历史见 [GitHub Releases](https://github.com/EasySB-Team/EasySB/releases)；更细的逐条变更见仓库根目录的 `CHANGELOG.md`。

## v6.0.0（当前）

本版把发布范围收敛为 Debian / Ubuntu，发布通道整体改由 GitHub Release 承载。

### 平台与发布

- 平台收敛为 Debian / Ubuntu，架构收敛为 `amd64` 与 `arm64`，只保留 `.deb` 一种包。`release/TAGS`、`VERSION` 与 `Makefile` 的架构表同步收敛，删除 rpm、pacman 以及其它架构的全部定义。
- 软件源改为附在 GitHub Release 上的扁平 apt 仓库，地址固定为 `https://github.com/EasySB-Team/EasySB/releases/latest/download`。`make repo` 把 `.deb` 摆进一层目录，用 `apt-ftparchive` 生成索引并签名，公钥 `easysb-archive-keyring.asc`、`install.sh` 与索引同处一层。一份包服务所有受支持的 Debian / Ubuntu 发行版。
- `install.sh` 收敛为极简 apt 单路径：核对 `/etc/os-release` 是否为受支持的发行版，装好签名公钥与源，再交给 apt。参数只保留 `--repo-url` 与 `--lang`。
- 安装路径由 `/usr/local/bin` 改为 `/usr/bin`，面板与快捷指令分别是 `/usr/bin/easysb` 与 `/usr/bin/sb`。
- `make pkg-stage` 在暂存树里对二进制做 UPX 压缩，release 资产与软件源因此是同一批字节。
- 发布只保留最新一版：工作流在 publish 后裁掉上一个 release 及其 tag。

### 升级与自更新

- 自更新改走 apt：`internal/update` 用 `dpkg-query` 比对已安装版本，经 `apt-get install` 升级 `easysb` 包，不再下载压缩包自替换运行中的二进制。面板 `版本更新` 入口与资产名随之更新。

### 清理与加固

- 删除发布服务器与服务器置备链路，源由 GitHub Release 直接承载。
- 删除已无用的 sing-box 重编译脚本与工作流，内核已编译进面板。
- CI 权限收窄并固定 Actions 版本；pull request 走同一套门禁但不发布。
- 一批并发与安全修复，包括账号文件的跨进程锁、订阅服务 TLS 判定与打印地址一致、下载原子落盘与临时目录私有化。

## v5.0.0

本版把内核与证书都收进面板，并引入固定版式与测量工具箱的前身。

### 内核编译进面板

- `github.com/sagernet/sing-box v1.14.2` 成为 `go.mod` 的直接依赖，节点就是面板自己，即 `easysb core run -c /etc/sing-box/config.json`。`/etc/sing-box/sing-box` 不再存在，面板装完即带内核。新增 `internal/sbcore` 与 `internal/download`，删除原来的 `internal/core`。
- 构建标签只有一处定义，即 `release/TAGS`（当前 `with_quic,with_utls,with_v2ray_api,with_clash_api,with_wireguard`）。`with_v2ray_api` 决定能否按账号统计流量，由 `internal/sbcore` 的一对带标签文件回答，部署前用 `StatsCapable()` 决定是否写入 `experimental.v2ray_api`。
- 删除「内核管理」整页，主菜单第一项先改为「服务解锁状态」，后续再扩展为「工具箱」。

### 证书改为内置 lego

- `github.com/go-acme/lego/v5` 在面板进程内完成 ACME 开户与 HTTP-01 签发，不再下载 `acme.sh`，也不再需要 `socat` 或 `python`。ACME 账户与证书放在 `/etc/sing-box/acme/`，续期定时器仍由面板安装。

### 界面与测量

- 界面固定成一套上下两个框，尺寸与位置照主页面，终端不足时由看板吸收空缺，条目多的页面在框内截断并写明剩余行数。
- 新增服务解锁检测，用 Go 重新实现 RegionRestrictionCheck 的探测，覆盖 17 项服务，每项只发少量请求，读不出结论时如实报未知。该能力后续扩展为工具箱。
- 界面偏好可记忆（皮肤、配色、标记、语言），并新增 `--theme` 与系统信息页。

### 版本管理

- 版本号收敛到 `VERSION` 并用 `go:embed` 编译进二进制，删除 `main.version` 默认值与 `-ldflags` 注入，裸构建与发布版报告同一个号。

## v4.0.0

本版引入账号体系、内置订阅服务与流量统计。

### 账号与流量

- 账号存放在 `/etc/sing-box/easysb-users.json`，权限 `0600`。每个账号拥有各协议独立凭据、流量限额、有效期、可用协议与启用开关。停用、过期、超额账号会自动从内核配置中移除，恢复后自动加回。
- 客户端需要按账号重新导入订阅。节点级的 UUID 与密码被移除。

### 内置订阅服务

- 删除 `internal/nginx` 与静态订阅目录，由 `easysb --serve`（`easysb.service`）在 `SUB_SERVE_PORT`（默认 `8443`）上提供唯一端点 `/sub/<令牌>`，按 User-Agent 返回 sing-box JSON、mihomo YAML 或 Base64 分享链接文档。
- 订阅服务每 `SUB_SYNC_SECONDS`（默认 `300`）秒读取内核 `StatsService` 计数并累加到账号，跨过限额或到期时重启内核生效；响应头 `Subscription-Userinfo` 上报已用流量、限额与到期时间。
- 状态键新增 `SUB_SERVE_PORT`、`SUB_SYNC_SECONDS`，移除描述旧 nginx 站点的 `SUB_PORT` 与 `SUB_PATH`。

### 界面

- 新增皮肤框架，四套皮肤与深浅两套配色自由组合，通过 `--skin` 或 `EASYSB_SKIN` 选择。
- 新增系统信息页，可查看运行环境并在界面内即时切换皮肤、配色、标记与语言。
- 图标方案重做，默认改为一套单宽 Unicode 符号，不依赖 Nerd Font；`--icons ascii` 提供纯 ASCII 回退。

## v3.0.0

- 全量 Go 重写，移除 bash 实现。基于 bubbletea / bubbles / lipgloss 的深色全屏仪表盘，编译为单一静态二进制，以 `sb` 呼出。
- 命令参数改为 Go flag：`--language`、`--icons`、`--apply-firewall`、`--render`、`--version`、`--help`。
- 仪表盘改为多卡片布局，新增设备信息与节点信息卡片；发布改为 `.github/workflows/easysb-go-release.yml` 交叉编译多平台二进制，以版本 tag 发布。

## v2.0.0

- 脚本整体重写为五合一部署器：AnyTLS、Hysteria2、TUIC v5、VMess + WebSocket + TLS、VLESS + Vision + Reality。
- 内核来源切换为官方 `SagerNet/sing-box` Releases，支持安装、卸载与替换并保留配置。
- 证书管理基于 `acme.sh --standalone`；Hysteria2 端口跳跃默认 `2080:3000`，自动下发 DNAT 规则并生成开机恢复单元。
- 订阅管理基于模板渲染，由 nginx 以静态站点形式提供；支持 Alpine / OpenRC 与 Debian / Ubuntu / systemd 双平台。

::: tip
v2.0.0 及更早的版本由 bash 脚本实现，细节已随实现一并移除，这里的记录用于追溯。
:::
