# pod-daemon（Rust）从二进制 strings 还原的源码布局

二进制：`/pod-daemon`，ELF 64-bit LSB pie，static-pie linked，`not stripped`。

PID 1：`/tini -- /pod-daemon --ssh-auth-sock-path /run/host-services/ssh-auth.sock --ssh-auth-vsock-port 52 --pod-identity-sock-path /run/cursor/api.sock`

## crate / 文件（strings 中的 `pod-daemon/src/...`）

| 路径 | 职责（从符号/日志串推断） |
| --- | --- |
| `pod-daemon/src/main.rs` | 入口、OOM protect (`oom_score_adj=-1000`)、HTTP/2 ping/go_away |
| `pod-daemon/src/config.rs` | clap：`LISTEN_ADDR` 默认 `0.0.0.0:26500`、`AUTH_TOKEN_SHA256`、`MAX_PROCESSES`、stream buffer、ssh auth bridge、`POD_IDENTITY_SOCK_PATH` |
| `pod-daemon-core/src/server.rs` | gRPC `PodDaemonService` |
| `pod-daemon-core/src/filesystem.rs` | 磁盘指标（读 `/proc/self/mountinfo`） |
| `pod-daemon-core/src/process.rs` | 进程跟踪 |
| `pod-daemon/src/platform/linux/server.rs` | Linux 实现、disk metrics |
| `pod-daemon/src/platform/linux/process_manager.rs` | `create_process_with_options`、`attach_process`、`stop_process`、`list_processes`、`send_output_event`、`stream_buffer_size`、supervision |
| `pod-daemon/src/platform/linux/pod_health.rs` | 健康检查 |
| `pod-daemon/src/platform/linux/guest_socket_proxy.rs` | `ssh_auth` + `pod_identity` guest socket 代理；日志 `Started guest socket proxy` |

## 配置字段（clap）

- `listen-addr` 默认 `0.0.0.0:26500`（本 run TCP 26500 在听）
- `auth-token-sha256`：bearer 的 SHA-256 digest，不是 bearer 本身；注释写明可进不可变容器 argv
- `ssh-auth-sock-path` + `ssh-auth-vsock-port`：必须成对；host vsock 52 把宿主机 SSH agent 桥进 guest
- `pod-identity-sock-path`：guest Unix socket，文档串为 “cloud-agent OIDC identity API”，本 run 为 `/run/cursor/api.sock`
- 认证失败日志：`pod-daemon authentication failed`、header `x-anyrun-pod-daemon-token`
- 字符串：`computer use is not supported by this pod-daemon`（computer-use 由 exec-daemon + 桌面栈承担）

## 本 run 相关监听

| 地址 | 推断 |
| --- | --- |
| `0.0.0.0:26500` | PodDaemonService gRPC |
| `0.0.0.0:50052` | 未在 argv 出现；未证实用途 |
| `0.0.0.0:2375` | Docker HTTP API（`curl 127.0.0.1:2375/_ping` → `OK`）；进程表里没有独立 `dockerd` |
