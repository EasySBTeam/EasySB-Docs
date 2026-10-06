---
title: 账号与流量
---

# 账号与流量

EasySB 用逐账号模型取代了旧版的节点级凭据：每个账号在每个协议上拥有独立凭据，并带有流量限额、有效期与可用协议。账号库 `/etc/sing-box/easysb-users.json` 是凭据的唯一来源，内核配置与订阅内容都从它派生。

## 账号库文件

账号库固定位于 `/etc/sing-box/easysb-users.json`，权限 `0600`。写入是原子的：面板先在目标目录创建 `*.tmp-*` 临时文件，写完后再 `rename` 到位，因此不会出现写了一半的文档；`CreateTemp` 本身即 `0600`，关键材料不会受调用进程的 umask 影响。

文件顶层是版本号与账号数组：

```json
{
  "version": 1,
  "users": [
    {
      "name": "alice",
      "remark": "phone",
      "token": "k7m2p9q4rt3xz8",
      "enabled": true,
      "protocols": ["anytls", "hysteria2", "tuic"],
      "credentials": {
        "anytls": { "password": "Wq3vC1r9pLkZ8sTn" },
        "hysteria2": { "password": "Yb6nH2tRf4wQ1xMe" },
        "tuic": {
          "uuid": "a9a6e2b5-5e34-4899-9865-f021e27bafc3",
          "password": "Jd8kS3mZp5vLo2cB"
        }
      },
      "quota_bytes": 107374182400,
      "used_bytes": 21474836480,
      "upload_bytes": 6442450944,
      "download_bytes": 15032385536,
      "created_at": "2026-09-24T11:00:00Z",
      "expire_at": "2026-10-24T00:00:00Z",
      "last_reset": "2026-10-01T00:00:00Z",
      "applied": true
    }
  ]
}
```

上面的凭据同样是示例值，真实账号由面板生成。

## 字段

| 字段 | 说明 |
| :--- | :--- |
| `name` | 账号显示名，用于界面与客户端节点名前缀；最长 40 个字符 |
| `remark` | 备注，可为空 |
| `token` | 订阅地址中的令牌，同时是内核侧统计所用的用户名；小写 ASCII 字母、数字与连字符 |
| `enabled` | 管理员开关。关闭即停用，凭据保留 |
| `protocols` | 该账号可用的协议键，按固定规范顺序保存 |
| `credentials` | 按协议键存放凭据，只有该协议需要的字段 |
| `quota_bytes` | 流量限额，单位字节；`0` 表示不限额 |
| `used_bytes` | 已用总量，等于上传加下载 |
| `upload_bytes` | 累计上传字节 |
| `download_bytes` | 累计下载字节 |
| `created_at` | 创建时间 |
| `expire_at` | 到期时间；零值表示永不过期 |
| `last_reset` | 当前流量周期的起点，用于按月重置 |
| `applied` | 该账号当前是否已写入内核配置，仅供限额执行判断是否需要重启 |

`credentials` 按协议键保存，协议键来自 `internal/state`（`state.Keys`）：`vless-reality` 与 `vmess-ws-tls` 用 `uuid`，`anytls` 与 `hysteria2` 用 `password`，`tuic` 两者都要。

## 派生状态

状态不写入文件，每次读取时按当前时刻计算，因此原因消失后账号会自动恢复资格。判断顺序如下：

| 状态 | 条件 |
| :--- | :--- |
| `disabled` | `enabled` 为 false |
| `expired` | `expire_at` 非零且已到期 |
| `over-quota` | `quota_bytes` 大于 0 且 `used_bytes` 达到或超过它 |
| `active` | 以上都不满足 |

`quota_bytes: 0` 表示不限额，零值的 `expire_at` 表示永不过期，两者都不会触发停用。

## 凭据的保留

取消勾选某个协议时，该协议的凭据会保留在 `credentials` 里，再次勾选会复用原值，因此已导入客户端的用户不会被重新生成的凭据打断。账号被停用、过期或超额时，数据同样保留，续费或重置后即可恢复。

## 内核侧映射

内核侧的**用户名就是 `token`**，而不是显示名。V2Ray 的计数键形如 `user>>><name>>>traffic>>>…`，名字既是聚合键，又会被当作 `QueryStats` 的正则匹配模式：随机 ASCII 令牌天然唯一，且跨重命名保持稳定，而显示名可能是中文或含正则元字符。

具体映射规则：

- 每个启用的入站，会为所有「选择了该协议、已启用、未过期、未超额」的账号写入一条 `users` 记录。
- 同名账号出现在多个入站时，统计聚合到同一组计数器。
- `experimental.v2ray_api` 的 `stats.users` 白名单与入站 `users` 用同一套判断重建，只有名单内的名字会被计数。

因此重命名账号不会改变令牌，客户端无需重新导入，统计也不会中断。

## 流量统计与重置

用量来自内核的 `StatsService`（`experimental.v2ray_api`），由订阅服务 `easysb --serve` 中的统计循环周期性采样（默认每 `SUB_SYNC_SECONDS` 秒，默认 `300`）。

1. 每次采样以覆盖全部用户的模式调用 `QueryStats` 并带 `reset=true`，随后把增量累加到已存计数器。
2. 计数器驻留在运行中的内核里，内核一重启就归零，所以持久化的是增量而非绝对值。
3. 当 `last_reset` 所在月份与当前月份不同时，`used_bytes`、`upload_bytes`、`download_bytes` 归零，`last_reset` 移到本月。
4. 面板中的「重置已用流量」只清零存储的计数器，内核侧计数器由下一次 `QueryStats(reset=true)` 清掉。

周期按主机本地时区的自然月计算，不是滚动 N 天窗口，因此「每月」对读者就是日历上的一个月。

## 限额与执行

sing-box 只暴露 `StatsService`，没有可在运行时增删用户的接口，因此限额执行的方式是重写配置并重启内核：

1. 账号变为停用、过期或超额时，从渲染出的 `/etc/sing-box/config.json` 中移除，`applied` 置为 false。
2. 新配置先由面板携带的内核 `check` 接受，再重启 `sing-box.service`。
3. 续费、重置配额或重新启用时，按相反方向恢复。

只在状态发生迁移时重写并重启，而不是每个采样周期都做。代价是账号跨过阈值的瞬间会有一次亚秒级的内核重启，此时该节点上的所有用户会短暂断开。订阅服务对停用、过期或超额账号返回 `403` 与纯文本原因，而不是一份没有节点的半成品配置，详细行为见 [订阅](/features/subscription)。

## 在面板中管理

账号生命周期由主菜单的 `账号与流量` 入口负责；面向客户端的订阅相关操作留在 `订阅管理`。两者的分工：

| 入口 | 负责 |
| :--- | :--- |
| `账号与流量` | 账号列表、新建、名称 / 备注 / 流量限额 / 有效期 / 可用协议 / 启停、重置已用流量、更换令牌、删除 |
| `订阅管理` | 订阅地址前缀、订阅服务单元的安装 / 重启 / 状态，以及查看某个账号的订阅 |

`账号与流量` 下的每个账号进入自己的子菜单，展示该账号的订阅地址、各客户端格式的二维码与逐协议分享链接。更换令牌会立刻让旧订阅地址失效，但不会改变已发放的协议凭据；收回访问权限应停用或删除账号。重命名则不影响令牌与统计。

## 相关

- [订阅](/features/subscription)
- [内核构建](/config/core-builds)
- [运行时路径](/config/paths)
- [配置模板](/config/templates)
