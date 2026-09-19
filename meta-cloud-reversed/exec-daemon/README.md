# exec-daemon：`hatch-execd`（Meta 侧工具执行面）

对标 `cursor-cloud-reversed/exec-daemon/`：Cursor 侧是 webpack 打包的 Node `exec-daemon`
（Connect-ES 生成的 `agent.v1.*` gRPC 服务：ExecService / PtyHostService / TmuxSessionService /
ControlService）；Meta 侧是 Rust/Go 风格原生二进制 `hatch-execd`，走 **systemd socket 激活**
而非 TCP gRPC。

## 二进制证据

| 证据 | 内容 |
| --- | --- |
| 启动方式 | `hatch-execd requires --socket when systemd socket activation (LISTEN_FDS) is unavailable` —— 必须经 systemd socket 激活，或显式传 `--socket` |
| 启动日志串 | `execd server started (systemd socket activation)` |
| 对端鉴权 | `execd rejected connection from wrong uid`、`execd peer_cred failed, rejecting` —— 用 Unix socket `peer_cred` 做 uid 鉴权，而非 bearer token（Cursor pod-daemon 用 `x-anyrun-pod-daemon-token` + sha256） |
| 背压 | `subprocess executor is draining; rejecting new subprocess start` —— executor 有排空状态 |
| 防篡改 | `taint-guard: could not stat the cell root; tamper detectors stay unarmed`、`execd fatal: taint anchor did not arm; exiting`、`cell /run tmpfs/run/hatch`、`bundle image /opt/hatch` |
| 进程原语（strings） | `exec`、`execvp`、`kill`、`process`、`session_`、`spawn_ta`、`stream` |

未在 strings 中发现 `.proto` / gRPC / ConnectRPC 痕迹（**观察**）：Meta 侧 exec 面不走
protobuf 服务定义，至少在本二进制中不可见。

## 工具调用链（本 run 实测，观察）

```
agent 工具调用 (tool_call_id=call_01a0b9f7…)
  → /opt/hatch/bin/hatch-execd          (socket 激活的 exec 守护进程)
  → /bin/bash --norc --noprofile -c 'umask 0007; <command>'
  → 子进程 (web-search / browser task / …)
```

要点：
- 每个工具调用都经过 `hatch-execd` 派生，`--norc --noprofile` 保证干净 shell，
  `umask 0007` 保证新建文件组不可读以外的默认权限。
- 子代理（subagent）同样走这条链：`subagent.spawn` 在本 run 中表现为 `hatch-execd`
  的子进程（`web-search --request-id req:fallback:… --iteration-index 2` 即研究子代理的检索进程）。
- 浏览器任务由 `browser-broker` 路由到租赁的 VM 浏览器（`--browser-vm-image`），
  与 exec 面分离。

## 与 Cursor exec-daemon 的对照

| 维度 | Cursor cloud `exec-daemon` | Meta `hatch-execd` |
| --- | --- | --- |
| 形态 | Node webpack bundle（约 14MB） | 原生二进制 |
| 服务契约 | Connect-ES `agent.v1.*` proto（Exec/PtyHost/TmuxSession/Control） | 无 proto 痕迹；socket + 命令行 |
| 监听 | TCP（本 run 推断） | systemd socket 激活（Unix socket） |
| 鉴权 | bearer token（sha256 存 argv） | Unix `peer_cred` uid |
| 会话 | tmux session service | `session_` 符号存在，但未见 tmux |
| 磁盘缓存 | request-context disk cache | 未见对应物；上下文由 agent-host 记忆层承担 |
| 防篡改 | 未见 | taint-guard / taint anchor |

## 推断

Meta 把"执行"与"会话/上下文"解耦：`hatch-execd` 只做**受鉴权的进程派生**，
会话、记忆、上下文缓存上移到 agent-host（`MEMORY.md`、`~/memory/`、memory socket）。
Cursor 则把 request-context 磁盘缓存做进了 exec-daemon 本体。
