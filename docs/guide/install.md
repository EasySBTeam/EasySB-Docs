---
title: 安装
---

# 安装

EasySB 以 Debian / Ubuntu 软件包分发，面板与内核在同一个 `.deb` 里。安装方式有两种：一键脚本配好 apt 软件源后安装，或手动 `dpkg -i` 安装单个包。

## 一键安装

```bash
curl -fsSL https://sb.kejizero.xyz/install.sh | sudo bash
```

脚本做的事情与 Docker 官方的 `get.docker.com` 同形：

1. 读取 `/etc/os-release`，把本机映射到 `bookworm`、`trixie`、`noble` 三个套件之一。
2. 从软件源根取回 armored 公钥，解甲后落到 `/usr/share/keyrings/easysb-archive-keyring.gpg`。
3. 把一行 `deb` 源写进 `/etc/apt/sources.list.d/easysb.list`。
4. 执行 `apt-get update` 并 `apt-get install easysb`。

脚本参数：

| 参数 | 说明 |
| :--- | :--- |
| `--repo-url URL` | 软件源根地址，默认 `https://sb.kejizero.xyz`，也可用环境变量 `EASYSB_REPO_URL` 指定 |
| `--lang C\|E` | 脚本输出语言，默认中文 |
| `-h` / `--help` | 显示用法 |

## 软件源机制

软件源由 GitHub Pages 固定发布在 `https://sb.kejizero.xyz`，地址不随版本变化，因此一条源配置可以一直用下去。安装脚本写出的那一行形如：

```text
deb [signed-by=/usr/share/keyrings/easysb-archive-keyring.gpg] https://sb.kejizero.xyz <suite> main
```

其中 `<suite>` 是 `bookworm`、`trixie`、`noble` 之一：

| 套件 | 对应系统 |
| :--- | :--- |
| `bookworm` | Debian 12 |
| `trixie` | Debian 13 |
| `noble` | Ubuntu 24.04 |

关键路径：

| 路径 | 内容 |
| :--- | :--- |
| `/usr/share/keyrings/easysb-archive-keyring.gpg` | 解甲后的签名公钥，供 `signed-by` 使用 |
| `/etc/apt/sources.list.d/easysb.list` | 上面那一行 apt 源 |
| `https://sb.kejizero.xyz/easysb-archive-keyring.asc` | 源根发布的 armored 公钥 |

软件源是一棵标准 apt 树：一份共享的 `pool/main/e/easysb/`，以及每个套件自己的 `dists/<suite>/main/binary-<arch>/`。索引由发布流程用一把 GPG 密钥签名（`InRelease` 与 `Release.gpg`）；缺少签名密钥时发布直接失败，不会发出未签名的索引。一份包服务全部三个套件：它除 `ca-certificates` 外不依赖任何东西，版本串里因此不带发行版（形如 `6.0.0-1`），升级发行版也不会改变 apt 装的是哪一份。

配置好源之后即可用 apt 安装与升级：

```bash
# 安装
sudo apt update && sudo apt install easysb

# 升级
sudo apt upgrade
```

## dpkg 安装

不想配置软件源时，可以从 GitHub Release 下载对应架构的 `.deb` 直接安装。当前版本为 6.0.0，资产名形如 `easysb_6.0.0-1_amd64.deb`：

```bash
# 架构可选 amd64 或 arm64
sudo dpkg -i easysb_6.0.0-1_amd64.deb

# 缺少依赖时补齐
sudo apt-get -f install
```

## 包内容

一个 `.deb` 同时带上面板与内核（内核已编译进二进制），装完即装好：

| 路径 | 内容 |
| :--- | :--- |
| `/usr/bin/easysb` | 面板，sing-box 内核已编译在内 |
| `/usr/bin/sb` | `easysb` 的快捷指令 |
| `/usr/lib/systemd/system/sing-box.service` | 节点单元：`easysb core run -c /etc/sing-box/config.json` |
| `/usr/lib/systemd/system/easysb.service` | 订阅服务单元：`easysb --serve` |
| `/usr/share/licenses/easysb/LICENSE` | 许可证全文 |

包内的两个 systemd 单元由二进制自己打印：

```bash
# 节点单元
sb --print-unit node

# 订阅服务单元
sb --print-unit sub

# 指定写入单元的可执行文件路径（默认 /usr/bin/easysb）
sb --print-unit node --unit-exec /usr/bin/easysb
```

打包与面板运行时写单元用的是同一段代码，因此包内的单元和运行时写下的单元不会各自漂移。

## 为什么安装时不自动启动

安装包带上单元，但刻意不 enable、不 start。原因很直接：新装机器还没有节点配置，此时启动节点服务没有意义。正确的顺序是先运行 `sb` 配置节点，面板会在部署完成后自动 enable 并 start `sing-box.service`。订阅服务则由 `订阅管理` 里的 `安装订阅服务` 写入并启用。

包内的单元位于 `/usr/lib/systemd/system`，面板运行时写下的单元位于 `/etc/systemd/system`。面板的副本存在时以它为准，包内的副本作为兜底，两者不会争抢同一个路径。

## 下一步

- 首次部署流程见 [快速开始](/guide/quickstart)。
- 卸载与清理见 [卸载](/guide/uninstall)。
