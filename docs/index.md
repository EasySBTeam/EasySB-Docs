---
layout: home

hero:
  name: EasySB
  text: sing-box 五合一部署面板
  tagline: 一个面向 Linux VPS 的一体化面板：五个协议、证书签发、订阅生成与流量统计收进一套交互式菜单，sing-box 内核直接编译进二进制。
  image:
    src: /logo.png
    alt: EasySB
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quickstart
    - theme: alt
      text: 查看文档
      link: /guide/intro
    - theme: alt
      text: GitHub
      link: https://github.com/EasySBTeam/EasySB

features:
  - title: 一条命令安装
    details: 与 get.docker.com 同形状的安装脚本，核对 Debian / Ubuntu 发行版，装好签名软件源后交给 apt，之后 apt upgrade 即可升级。
  - title: 五协议开箱即用
    details: AnyTLS、Hysteria2、TUIC v5、VLESS + Vision + Reality、VMess + WebSocket + TLS，端口逐一编排，账号凭据逐人独立。
  - title: 内核已编译进面板
    details: sing-box 是 go.mod 的直接依赖，节点就是 easysb core run，没有内核二进制要下载、替换或切换。
  - title: 内置证书签发
    details: 通过 go-acme/lego 在面板进程内申请 Let's Encrypt 证书，HTTP-01 校验，无需 acme.sh 或 socat，续期由自带 systemd timer 驱动。
  - title: 账号与流量统计
    details: 每个账号按协议拥有独立凭据，支持流量限额、有效期、可用协议、启停、重置流量与更换令牌，超额账号自动从内核配置移除。
  - title: 测量工具箱
    details: 流媒体 / AI / 区域解锁检测、三网回程、就近与三网测速、IP 质量、邮件端口、CPU 与磁盘跑分，结论只给解锁 / 不解锁 / 未知。

---

## 一条命令安装

安装脚本核对本机 `/etc/os-release` 是否在受支持的发行版内，写入签名 apt 软件源，再由 apt 安装候选版本。软件源就是 GitHub Release 本身，固定在 `https://github.com/EasySBTeam/EasySB/releases/latest/download`，地址不变，所以一条软件源配置可以一直用下去。

```bash
curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash
```

安装完成后以快捷指令启动：

```bash
sb
```

支持 Debian 12+ / Ubuntu 24.04+（systemd，amd64 与 arm64），需要 root 权限运行。

## 为什么是 EasySB

EasySB 把「一台 VPS 到底能干什么、怎么把它变成一台可用节点」收敛成一个深色仪表盘。面板本身是单一静态二进制，`templates/` 里的五个协议样例是可直接阅读、复制的 JSONC，既可以只用模板，也可以交给程序自动落地。

| 能力 | 说明 |
| :--- | :--- |
| 五协议部署 | 端口逐一询问，回车取默认、`r` 随机、数字手动；节点只保留不属于账号的材料 |
| 账号与流量 | 逐人逐协议独立凭据，支持限额 / 有效期 / 可用协议 / 启停 / 重置 / 换令牌 |
| 订阅生成 | 每个账号一个 `/sub/<令牌>`，按 User-Agent 自动选择格式，并上报用量 |
| 证书管理 | lego 进程内申请、查看、切换、删除与自动续期，全程无需外部脚本 |
| 端口跳跃 | Hysteria2 DNAT 规则，自动下发并生成开机恢复单元 |
| 工具箱 | 解锁、回程、测速、IP 质量、端口与硬件性能集中测量，结果看板记忆 |

## 接下来

1. 阅读 [简介](/guide/intro) 了解整体设计。
2. 按 [快速开始](/guide/quickstart) 完成第一次安装。
3. 需要精确参数时查阅 [配置模板](/config/templates) 与 [订阅](/features/subscription)。
