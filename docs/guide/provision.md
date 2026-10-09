---
title: 无终端部署
---

# 无终端部署

面板是给人交互用的全屏界面，而整套部署也可以用一份 JSON 清单在没有 TTY 的情况下一次完成。这条入口是 `sb --provision`：它读入清单，签发证书、写入节点与账号、渲染内核配置、安装并启动服务，最后打印每个账号的订阅地址。脚本、CI 与批量初始化用它，就不必逐台机器手动点菜单。

前置条件与 [快速开始](/guide/quickstart) 一致：目标机已装好 EasySB，端口已放行，需要证书的协议要有一个已解析到本机的域名。

## 运行

```bash
# 从文件读取
sudo sb --provision deploy.json

# 从标准输入读取，脚本里最常用；
# 管道结束后机器上不会留下清单文件
sudo sb --provision - <<'JSON'
{
  "domain": "sb.example.com",
  "email": "ops@example.com",
  "accounts": [{ "name": "alice" }]
}
JSON
```

清单先校验、后执行。未知协议、端口越界、协议端口与订阅端口冲突、账号选了不存在的节点、字段拼写错误，都会在改动任何东西之前报错退出，因此一次失败的重跑不会留下半套配置。

## 清单格式

一份包含全部字段的完整清单如下，可直接作为起点修改：

```json
{
  "domain": "sb.example.com",
  "email": "ops@example.com",
  "server_ip": "203.0.113.10",
  "sub_port": 8443,
  "nodes": [
    { "protocol": "anytls" },
    { "protocol": "vless-reality" },
    { "protocol": "hysteria2", "port": 8001, "hop_range": "2080:3000" },
    { "protocol": "tuic" }
  ],
  "accounts": [
    { "name": "alice", "quota_gb": 100, "expire_days": 30 },
    { "name": "bob", "nodes": ["anytls"], "password": "a-shared-secret" }
  ]
}
```

### 顶层字段

| 字段 | 必填 | 说明 |
| :--- | :--- | :--- |
| `domain` | 使用除 VLESS + Reality 之外的协议时必填 | 证书域名；只部署 Reality 时可省略 |
| `email` | 与 `domain` 同时必填 | ACME 账户邮箱，用于到期通知 |
| `server_ip` | 否 | 写入状态；订阅地址在域名缺失时以它作主机 |
| `sub_port` | 否 | 订阅服务监听端口，默认 `8443` |
| `nodes` | 否 | 要部署的节点；省略时为全部五个协议的默认端口 |
| `accounts` | 否 | 要创建的账号 |

### nodes[]

| 字段 | 必填 | 说明 |
| :--- | :--- | :--- |
| `protocol` | 是 | `anytls`、`hysteria2`、`tuic`、`vless-reality`、`vmess-ws-tls` 之一 |
| `name` | 否 | 节点名，默认取协议标签；重名会被拒绝 |
| `port` | 否 | 默认按协议取 8000 至 8004；取值范围 1 至 65535，且不能与 `sub_port` 相同，也不能与其他节点重复 |
| `sni` | 否 | 仅 VLESS + Reality，默认 `apple.com` |
| `hop_range` | 否 | 仅 Hysteria2，默认 `2080:3000` |

### accounts[]

| 字段 | 必填 | 说明 |
| :--- | :--- | :--- |
| `name` | 是 | 账号名，账号之间不能重复 |
| `password` | 否 | 写入使用密码的协议（AnyTLS、Hysteria2、TUIC） |
| `uuid` | 否 | 写入使用 UUID 的协议（TUIC、VLESS + Reality、VMess + WS + TLS） |
| `quota_gb` | 否 | 流量限额，单位为 GiB，`0` 表示不限量 |
| `expire_days` | 否 | 有效期天数，`0` 表示不过期 |
| `nodes` | 否 | 可用节点的协议键或节点名，省略表示全部节点 |

未提供的凭据由面板生成随机值；提供的值只写入真正使用该字段的协议，因此给一个 UUID 协议配 `password` 不会产生多余的字段。

## 幂等与重跑

清单描述的是目标状态，而不是一次性脚本，所以重复执行是安全的：

- 节点按名称、或协议加端口匹配。已存在的节点沿用其 id 与密钥材料，Reality 密钥对因此不会在重跑时改变。
- 账号按名称匹配。已存在的账号会更新配额、有效期与可用节点，但保留订阅令牌与各协议已有凭据。已经导入客户端的订阅地址因此不会因重跑而失效。
- 需要证书时，只有本地叶证书临近到期才会真正重走 ACME，与面板的续期判定一致。

## 与面板的关系

`--provision` 走的就是面板同一条内部路径：证书由 `internal/cert` 在进程内签发，节点与账号写入面板读取的同两个存储文件，渲染与校验由 `internal/deploy` 完成。首次部署同样会应用端口跳跃防火墙、写入并启用 `easysb-firewall.service`，并安装订阅服务单元。因此清单部署完成之后，打开面板看到的就是这份清单的结果，后续的增删改仍可在面板里进行。

清单不包含 BBR 配置，这部分仍在面板的 `BBR` 页完成。

## 验证

```bash
sb --version
systemctl status sing-box
systemctl status easysb
easysb core check -c /etc/sing-box/config.json
curl -fsS 'https://<域名>:8443/sub/<令牌>'
```

`--provision` 成功时会把每个账号的订阅地址打印出来，直接交给客户端即可。没有为域名装好证书时（例如只部署 Reality），订阅服务以明文 HTTP 提供服务，打印出的地址也相应为 `http://`。

## 接下来

- 需要端口、域名与架构的前置条件：[系统要求](/guide/requirements)。
- 想先了解每个入口与参数：[简介](/guide/intro)。
- 部署原理与包职责：[架构](/dev/architecture)、[设计](/dev/design)。
