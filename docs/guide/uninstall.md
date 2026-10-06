---
title: 卸载
---

# 卸载

卸载分为两步：先在面板里运行内置的卸载入口，移除服务、规则、配置与快捷指令；再按需用 apt 移除软件包本身。

## 面板内卸载

在主菜单最后一项 `卸载脚本` 里执行。面板会按下面的顺序处理：

1. 把 `/etc/sing-box` 打包备份到 `/root/easysb-backup-<时间戳>.tar.gz`。
2. 把已签发的证书目录临时挪到安全位置，避免下一步删除工作目录时一起丢掉。
3. 停止并 disable `sing-box.service` 与 `easysb.service`。
4. 移除端口跳跃的 DNAT 规则与 `easysb-firewall.service`。
5. 移除面板自己写下的服务单元。
6. 删除工作目录 `/etc/sing-box`。
7. 删除快捷指令与面板路径（如 `/usr/bin/easysb`、`/usr/bin/sb`）。
8. 把证书目录放回原处。

### 保留的内容

- 已签发的证书与 ACME 账户，默认位于 `/etc/sing-box/acme/`（可用 `EASYSB_ACME_DIR` 覆盖）。保留它们是为了让重装不必向 Let's Encrypt 重新申请，避免白白消耗签发配额。
- `/root` 下的配置备份归档。

### 移除的内容

- `sing-box.service` 与 `easysb.service` 两个 systemd 单元。
- 端口跳跃规则与 `easysb-firewall.service`。
- 工作目录 `/etc/sing-box`（证书目录已在结束前放回，不受影响）。
- 面板快捷指令。

::: warning
内置卸载不会移除 `.deb` 软件包，也不会删除 apt 软件源。需要彻底清理时继续看下一节。
:::

## 手动移除软件包

软件包由 apt 管理，因此用 apt 移除：

```bash
# 移除软件包，保留配置
sudo apt remove easysb

# 连同配置文件一起移除
sudo apt purge easysb

# 清理不再需要的依赖
sudo apt autoremove
```

如果希望同时去掉软件源与公钥：

```bash
sudo rm -f /etc/apt/sources.list.d/easysb.list
sudo rm -f /usr/share/keyrings/easysb-archive-keyring.gpg
sudo apt update
```

## 卸载后重装

重装时证书目录仍在原处，面板会直接复用它，无需重新签发。如果同时也删除了证书目录，下次申请会重新注册 ACME 账户并重新签发；同一域名一周内重复签发有配额限制，请留意。

## 下一步

- 安装流程与软件源细节见 [安装](/guide/install)。
- 遇到疑问先看 [常见问题](/faq)。
