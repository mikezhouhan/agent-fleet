# pod-daemon（本机 Grok Bot box）

## 进程（证据）

```
PID1: /tini -- /pod-daemon \
  --ssh-auth-sock-path /run/host-services/ssh-auth.sock \
  --ssh-auth-vsock-port 52
```

监听：`0.0.0.0:26500`（`--help` 默认值）。

本 argv **未**显式传 `--pod-identity-sock-path`；箱内身份 socket 由 sand 侧提供为 `/tmp/sand-identity.sock`（`CURSOR_AGENT_SOCKET`）。

## `--help` 字段（证据）

与 Cursor Cloud 文档一致的选项：

| 选项 | 含义 |
| --- | --- |
| `--listen-addr` | gRPC，默认 `0.0.0.0:26500` |
| `--auth-token-sha256` | PodDaemonService bearer 的 SHA-256（可进不可变 argv） |
| `--ssh-auth-sock-path` / `--ssh-auth-vsock-port` | 宿主机 SSH agent vsock 桥 |
| `--pod-identity-sock-path` | cloud-agent OIDC identity guest socket |
| 进程流水位 | `max-processes` / `stream-buffer-size` / low·high events |

## strings 符号（证据）

- crate 路径：`pod-daemon/src/platform/linux/guest_socket_proxy.rs`
- proto 包名：`tonic_proto::anyrun::v1::*`
- 服务：`PodDaemonService`（`CreateProcess` / `AttachProcess` / `ReadTextFile` / `WriteTextFile` / `ListDirectory` / `ComputerUse` / `StreamMetrics` 等）

**推断**：编排层仍是 Cursor/anyrun 的 guest 监督面；Grok Bot 未替换 PID1，只在用户态叠加 sand 编排。

## orbitd

`/opt/orbit/current → releases/bcf29f8`，二进制 `orbitd`（约 374KB）。`/etc/sand-box-image-sha` = `bcf29f8`。本 run **无** orbitd 进程。

**推断**：orbit 发布号与镜像 SHA 对齐，用于镜像/热补丁通道标识，不是常驻控制面。
