---
title: 简介
---

# 简介

EasySB 是一个面向 Linux VPS 的 sing-box 五合一部署面板。它把协议部署、证书申请、账号与流量管理、订阅生成和主机测量收进一套深色全屏菜单，编译为单一静态二进制，以快捷指令 `sb` 呼出。

- 项目地址：https://github.com/EasySBTeam/EasySB
- 内核来源：https://github.com/SagerNet/sing-box
- 完整更新日志：[更新日志](/changelog)
- 常见问题：[常见问题](/faq)

## 单一静态二进制

EasySB 只有一个可执行文件，运行时不需要下载任何内核、脚本或辅助程序。sing-box 内核是 `go.mod` 的直接依赖，被编译进面板本体；证书通过 `github.com/go-acme/lego/v5` 在面板自己的进程里申请。安装好面板就等于装好了内核，节点就是面板以节点模式启动：

```
easysb core run -c /etc/sing-box/config.json
```

由此带来的直接结果是：没有内核二进制要下载、替换或切换，也不需要 `acme.sh`、`socat` 或 `python` 来签发证书。运行期唯一还会联网的下载，是可选的 BBR 内核包（`internal/bbr`）；面板自身的更新（`internal/update`）也只读取公开发布的 `VERSION` 来判断是否有新版本，真正的升级交给 apt。

程序版本写在仓库根目录的 `VERSION` 文件里，用 `go:embed` 编译进二进制；发布 tag 统一派生为 `v<VERSION>`。内核版本独立于程序版本，直接读编译进来的那个 sing-box 发行版。

## 支持的协议

五种协议覆盖 TCP、QUIC 与 WebSocket 三类承载，端口在部署时逐一编排。回车取默认值，输入 `r` 随机，输入数字手动指定；与其他协议冲突时会提示重设。

| 协议 | 承载 | 默认端口 | 特点 |
| :--- | :--- | :--- | :--- |
| AnyTLS | TCP + TLS | 8000 | Padding Scheme 多阶段填充，对抗流量指纹 |
| Hysteria2 | QUIC / UDP | 8001 | 弱网与高丢包场景表现优秀，支持端口跳跃 |
| TUIC v5 | QUIC / UDP | 8002 | 0-RTT 握手，`native` UDP 转发，低延迟 |
| VLESS + Vision + Reality | TCP | 8003 | 免证书伪装，默认偷用 `apple.com`，抗主动探测 |
| VMess + WebSocket + TLS | WS over TLS | 8004 | 可穿 CDN 与反向代理，基于标准 TLS |

::: warning
除 VLESS + Vision + Reality 外，其余协议都需要一个已解析到本机、且能签发有效证书的域名。详见 [系统要求](/guide/requirements)。
:::

## 能力概览

| 能力 | 说明 |
| :--- | :--- |
| 五协议部署 | 端口逐一编排；节点只保留不属于账号的材料（如 Reality 密钥对），账号凭据归各账号所有 |
| 账号与流量 | 每个账号在每个协议上拥有独立凭据，支持流量限额、有效期、可用协议、启用开关、重置流量与更换令牌 |
| 订阅生成 | 每个账号一个 `/sub/<令牌>` 地址，内置服务按客户端自动选择格式，并通过 `Subscription-Userinfo` 上报用量 |
| 证书管理 | 进程内申请、查看、切换激活、删除与自动续期 Let's Encrypt 证书，无需外部脚本 |
| 端口跳跃 | Hysteria2 默认 `2080:3000`，自动下发 iptables / nftables DNAT，并生成开机恢复单元 |
| 服务管理 | 启动、停止、重启、查看状态与开机自启 |
| BBR 加速 | 查看并启用 BBR，安装 Linux-BBR-v3 发布的预编译 BBRv3 内核，卸装与清空配置都在面板内 |
| 工具箱 | 解锁检测、三网回程、测速、IP 质量、邮件端口与硬件性能测量集中在一处 |
| 中英双语 | 启动首屏选择语言，全流程界面一致 |

进一步的能力说明见 [支持的协议](/features/protocols)、[订阅](/features/subscription)、[工具箱](/features/toolbox)。

## 仓库结构

```text
.
├── main.go                       # Go 入口，参数解析、core 子命令、--tool
├── VERSION                       # 程序版本，发布 tag 的唯一来源
├── release/TAGS                  # 构建标签的唯一来源
├── install.sh                    # 一键安装脚本（配好签名软件源并交给 apt）
├── Makefile                      # 构建、测试、打包入口（见 make help）
├── packaging/                    # 软件包生命周期脚本（deb/）与 apt 源构建（repo/）
├── go.mod / go.sum               # module github.com/EasySBTeam/EasySB，Go 1.27.1
├── templates/                    # 可读的 JSONC 协议样例与订阅模板
│   ├── anytls/
│   ├── hysteria2/
│   ├── tuic/
│   ├── vmess-websocket-tls/
│   ├── vless-vision-reality/
│   └── config/
│       ├── tun-fakeip.json       # sing-box TUN + FakeIP 订阅模板
│       └── mihomo.yaml           # mihomo / Clash Meta 订阅模板（可读镜像）
├── internal/                     # 全部实现包
├── assets/                       # README 横幅
├── docs/                         # 面向协作者的工程文档
├── README.md                     # 英文说明
└── README_ZH.md                  # 中文说明
```

`templates/` 下的协议样例是可直接阅读、复制的 JSONC；去掉注释后即可作为服务端或客户端配置使用。运行时真正加载的订阅模板通过 `//go:embed` 内嵌在 `internal/subscribe/` 中，`templates/config/` 保存的是可读镜像，编辑时需要成对同步。

## 接下来

1. 阅读 [系统要求](/guide/requirements)，确认系统、架构、域名与端口满足条件。
2. 按 [快速开始](/guide/quickstart) 完成第一次安装与部署。
3. 需要 `dpkg`、软件源或打包细节时查阅 [安装](/guide/install)。
4. 部署前想先看配置形态，可参考 [配置模板](/config/templates)。
