---
title: 快速开始
---

# 快速开始

这条路径把一个全新的 Debian 或 Ubuntu 主机变成一台可连接的节点：一条命令安装，`sb` 打开面板，完成语言、节点与账号，然后拿到订阅地址。

## 第一步：安装

安装脚本与 Docker 官方的 `get.docker.com` 是同一个形状：读取本机的 `/etc/os-release`，核对是否在受支持的发行版内，装好签名公钥与 apt 软件源，再交给 apt 安装。

```bash
curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash
```

脚本还接受两个参数：

```bash
# 指向镜像站
curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash -s -- --repo-url https://mirror.example.com

# 切换为英文输出
curl -fsSL https://github.com/EasySBTeam/EasySB/releases/latest/download/install.sh | sudo bash -s -- --lang E
```

::: tip
脚本只支持 Debian 12+ 与 Ubuntu 24.04+，架构为 amd64 与 arm64。详细条件见 [系统要求](/guide/requirements)，软件源与 `dpkg` 细节见 [安装](/guide/install)。
:::

## 第二步：启动面板

安装完成后，用快捷指令打开深色仪表盘：

```bash
sb
```

`sb` 是 `easysb` 的快捷指令，最终都指向同一个二进制。面板需要 root 权限运行。

启动首屏会先询问界面语言，选定后记忆到 `/etc/sing-box/easysb-ui.conf`，下次直接进入菜单。也可以在命令行预设语言：

```bash
# 简体中文
sb --language C

# English
sb --language E
```

::: tip
不想在面板里逐步操作，也可以把节点、证书与账号写进一份 JSON 清单，用 `sb --provision` 一次部署完成，见 [无终端部署](/guide/provision)。
:::

## 第三步：首次运行流程

面板的所有操作都从主菜单进入。首次部署按下面的顺序走一遍即可：

1. 在主菜单进入 `节点管理`，选择 `一键部署`。面板会逐个询问要启用的协议，以及每个协议的端口。回车取默认值，输入 `r` 随机，输入数字手动指定。
2. 若启用了需要证书的协议，先在 `域名管理` 里申请证书。申请前会做域名解析与端口占用预检，申请时短暂停内核以腾出 80 端口。
3. 进入 `账号与流量`，选择 `新建账号`。为账号设置名称、备注、流量限额、有效期与可用协议。账号的每个协议凭据在此时生成。
4. 回到 `订阅管理`，选择刚才的账号，面板会打印该账号的订阅地址前缀与各协议分享链接，也可以直接显示二维码。

部署流程会在节点没有任何账号时给出警告，因为此时还没有可连接的身份。这是警告而不是拒绝，预先创建节点依然可以部署。

::: tip
安装包不会自动 enable 或 start 服务。新装机器还没有节点配置，先运行 `sb` 配置节点，面板会在部署完成后自动 enable 并 start `sing-box.service`。订阅服务则由 `订阅管理` 里的 `安装订阅服务` 写入并启用。
:::

## 第四步：拿到订阅

每个账号只有一个订阅地址，其形式为 `/sub/<令牌>`，默认监听 `SUB_SERVE_PORT`（默认 `8443`）。格式由请求的 User-Agent 协商：

| 客户端 | 返回内容 |
| :--- | :--- |
| sing-box（SFM / SFA / SFI） | JSON 配置 |
| mihomo / Clash Meta / luci-app-nikki | 完整 YAML 配置 |
| v2rayN / passwall / passwall2 / homeproxy | Base64 分享链接文档 |

一个地址即可通用，也可以用 `?client=singbox|mihomo|v2ray` 强制指定格式。订阅内容与域名证书有关：域名下存在真实证书时由订阅服务自行终结 TLS，否则以明文 HTTP 提供服务并在面板中提示。

账号令牌既是订阅访问密钥，也是内核侧统计计数使用的用户名。更换令牌会立刻让旧订阅地址失效，但已导入客户端的协议凭据仍然有效，因此更换令牌本身不会收回访问权限；要真正收回某人的访问，需停用或删除该账号，此时账号会从内核配置中移除。重命名账号不会改变令牌，客户端无需重新导入。

## 接下来

- 想了解订阅为何返回 403、如何只删除一个账号：[常见问题](/faq)。
- 需要查看每个入口与参数：[简介](/guide/intro)。
- 想用一份清单无人值守地部署：[无终端部署](/guide/provision)。
- 需要卸载或迁移：[卸载](/guide/uninstall)。
