---
title: 运行时路径
---

# 运行时路径

EasySB 把节点状态、渲染出的配置、账号库、证书、界面偏好与服务单元都放在固定路径下。下表是运行时的完整清单，未单独标注权限的条目按目录与进程的默认权限处理。

## 路径表

| 路径 | 归属 | 用途 | 权限 |
| :--- | :--- | :--- | :--- |
| `/etc/sing-box/easysb.conf` | `internal/state` | 持久化的节点状态，兼容旧版的 KV 布局 | `0600` |
| `/etc/sing-box/config.json` | `internal/config` | 渲染出的服务端配置；携带与账号库相同的凭据 | `0600` |
| `/etc/sing-box/cert/` | `internal/cert` | 自签名占位证书对，在签发真实证书前使用 | 目录 |
| `/etc/sing-box/easysb-users.json` | `internal/user` | 账号：凭据、配额、有效期与计数器 | `0600` |
| `/etc/systemd/system/easysb.service` | `internal/service` | 订阅服务单元（`easysb --serve`） | 单元文件 |
| `/etc/systemd/system/sing-box.service` | `internal/service` | 内核服务单元 | 单元文件 |
| `/etc/sing-box/acme/` | `internal/cert` | ACME 状态；可用 `EASYSB_ACME_DIR` 覆盖 | 目录 |
| `/etc/sing-box/acme/account.key`、`account.json` | `internal/cert` | ACME 账户材料 | `0600` |
| `/etc/sing-box/acme/<domain>/fullchain.cer` | `internal/cert` | 每个域名目录下的证书链 | `0644` |
| `/etc/sing-box/acme/<domain>/private.key` | `internal/cert` | 每个域名目录下的证书私钥 | `0600` |
| `/etc/sysctl.d/99-easysb-bbr.conf` | `internal/bbr` | EasySB 自己写入的 BBR 设置 | 配置文件 |
| `/etc/modules-load.d/easysb-bbr.conf` | `internal/bbr` | 开机加载 `tcp_bbr` | 配置文件 |
| `/etc/sing-box/easysb-ui.conf` | `internal/prefs` | 界面选择（皮肤、配色、标记集、语言）；可用 `EASYSB_UI_CONF` 覆盖 | `0644` |
| `/etc/systemd/system/easysb-acme.timer` | `internal/cert` | 证书续期定时器 | 单元文件 |

## 覆盖项

两个环境变量可以把状态文件移出默认位置，便于测试或特殊布局：

| 变量 | 影响的路径 | 默认值 |
| :--- | :--- | :--- |
| `EASYSB_ACME_DIR` | ACME 状态目录，即 `account.key`、`account.json` 与按域名划分的证书目录 | `/etc/sing-box/acme/` |
| `EASYSB_UI_CONF` | 界面偏好文件 | `/etc/sing-box/easysb-ui.conf` |

## 程序与软件包路径

`.deb` 安装后面板本体与内核在同一份二进制里，配套的单元文本由二进制自己打印（`sb --print-unit node|sub`），与面板运行时写下的单元是同一段代码，因此包内与运行时不会各自漂移。

| 路径 | 内容 |
| :--- | :--- |
| `/usr/bin/easysb` | 面板，sing-box 内核已编译在内 |
| `/usr/bin/sb` | `easysb` 的快捷指令 |
| `/usr/lib/systemd/system/sing-box.service` | 节点单元：`easysb core run -c /etc/sing-box/config.json` |
| `/usr/lib/systemd/system/easysb.service` | 订阅服务单元：`easysb --serve` |
| `/usr/share/licenses/easysb/LICENSE` | 许可证全文 |

安装时不会自动 enable 或 start：新装机器还没有节点配置，先运行 `sb` 完成节点配置，面板会自动 enable 并 start 服务。

## 说明

`config.json` 与 `easysb-users.json` 都携带账号凭据，因此都收紧为 `0600`。账号库的写入是原子的（`*.tmp-*` 临时文件加重命名），状态文件的写入方式相同；账号模型详见 [账号与流量](/config/users)。

`99-easysb-bbr.conf` 与 `easysb-bbr.conf` 由 EasySB 自己写入，因此不会与 BBR 内核项目自己的 drop-in 冲突。sysctl 文件带有记录被替换值的注释，清除操作据此还原；已安装的内核包归 dpkg 管理，通过 apt 移除。

`easysb-acme.timer` 的单元里写着写入它的二进制路径，因此由面板内部安装（或用 `--install-renew-timer`），而不是在主机之间拷贝。证书由面板通过 lego 在进程内签发与续期，所以这个定时器是唯一的续期者，`--renew-certs` 会在续期后重载 `sing-box` 与订阅服务。

打包场景下，`.deb` 提供的单元位于 `/usr/lib/systemd/system`；面板运行时把自己的单元写到 `/etc/systemd/system`，因此面板的那份在其存在期间优先生效，打包的那份作为回退，二者不会争抢同一路径。相关背景见 [架构](/dev/architecture)。

## 相关

- [架构](/dev/architecture)
- [账号与流量](/config/users)
- [内核构建](/config/core-builds)
- [配置模板](/config/templates)
