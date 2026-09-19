# pod-daemon：`hatch` cell leader 与 runtime-cell（Meta 侧 pod 生命周期面）

对标 `cursor-cloud-reversed/pod-daemon/`：Cursor 侧是 Rust `pod-daemon`（static-pie，
PID1 `tini → pod-daemon`，gRPC `:26500`，clap 配置 `LISTEN_ADDR` / `AUTH_TOKEN_SHA256` /
ssh-auth vsock 桥 / pod-identity socket）。Meta 侧的对应物是 **`hatch` daemon
（runtime-cell leader）+ `/opt/hatch/runtime-cell/` 脚本集 + `/run/hatch/` 状态网**。

## 进程证据（本 run，观察）

| PID | 命令 | 推断 |
| --- | --- | --- |
| 1 | `/usr/lib/systemd/systemd` | Meta cell 用 systemd 作 PID1（Cursor 用 tini） |
| 67 | `/opt/hatch/bin/hatch daemon --runtime-cell-leader=1968` | cell leader 守护进程 |
| 729 | `/opt/hatch/bin/hatch-execd` | socket 激活的 exec 守护进程（见 exec-daemon/） |

## runtime-cell 脚本集（`/opt/hatch/runtime-cell/`，观察）

| 文件 | 职责（从文件名与注释推断） |
| --- | --- |
| `control-daemon.sh` / `control-execd.sh` | daemon / execd 的启停控制 |
| `guest.env` | cell 内环境模板：`HOME=/home/hatch`、`JARVIS_BIN_DIR=/opt/hatch/bin`、`JARVIS_STEFI_PROXY_SOCK=/run/hatch/proxy/stefi.sock`；注释写明"安装时模板变量派生，不依赖宿主 `/etc/hatch/env`"，root-owned 且 BindReadOnly 进 cell，cell 内不可改 |
| `guest-runtime-env.sh` | in-cell daemon 路径的环境构造 |
| `ensure-rootfs.sh` | rootfs 就绪保证 |
| `build-cell-trust-store.sh` | cell 信任库构建（对应 egress TLS 的 `ca-bundle.pem`） |
| `bin-scopes.conf` | 二进制作用域配置（推断：工具平面权限范围） |
| `hatch-preflight-opportunistic`、`is-loopback-rv.sh` | 预检与回环检测 |

## `/run/hatch/` 状态网（观察）

`auth/`、`cell-anchors/`、`egress-tls/`、`privsep/`、`resume/`、`runtime-cell/`、
`sandbox/`、`sandbox-api/`、`telemetry/`、`noded/`、`egress-tz/`。

环境变量暴露的 socket（值已脱敏，仅保留名）：
`daemon/http-api.sock`、`memory/memory.sock`、`proxy/inference.sock`、
`proxy/stefi.sock`、`safety/security.sock`、`sandbox-api/api.sock`、
`sentinel/http-api.sock`、`telemetry/telemetry.sock`、`rescue/rescue-signal.sock`。

解读（推断）：这是一个**按职责拆分的 Unix-socket 服务网格**——推理、记忆、安全、
沙箱、哨兵（sentinel）、遥测各自独立 socket，而非 Cursor 式的单一 gRPC 端口。

## 周边守护进程（`--help` 实测，观察）

| 二进制 | 一句话 |
| --- | --- |
| `hatch-healthd` | 轮询 `JARVIS_METRICS_SOCKET`（默认 `/run/hatch/daemon/metrics.sock`）的 `/health`；宿主侧 healthd 经共享 bind mount 直连，绕过 cell 的 IPv6 veth |
| `spawnd` | "Jarvis runtime installer engine"；`emit-daemon-lifecycle` 从 runtime-cell 边界准备 daemon 生命周期交接数据 |
| `browser-broker` | 把浏览器会话路由到租赁的 VM 浏览器（`--browser-vm-image`） |
| `ingress-rev-proxy` | 对外 ingress 反向代理，Noise_XX 加密 |
| `hatch-ws-client` | Jarvis daemon RPC 的 websocket 客户端；`chat-send` 发单条消息并打印最终回复 |
| `hatch-vault` | 凭据保险库（`--help` 挂起未返回，未深究） |

## 与 Cursor pod-daemon 的对照

| 维度 | Cursor `pod-daemon` | Meta `hatch` + runtime-cell |
| --- | --- | --- |
| PID1 | `tini → pod-daemon` | systemd；`hatch daemon` 为 cell leader |
| 控制面协议 | gRPC `:26500`（`PodDaemonService`） | Unix socket 网（多 socket 按职责拆分） |
| 鉴权 | bearer token sha256 | peer_cred uid（execd）；socket 路径隔离 |
| 身份 | pod-identity socket（OIDC） | `JARVIS_HATCHLING_ID`、`*.metaaivm.com` FQDN（已脱敏） |
| SSH 桥 | ssh-auth vsock 52 | 未见对应物 |
| 健康检查 | pod_health | `hatch-healthd` + metrics socket |
| 出口 | 未见 | 强制 egress proxy（`hatch-egress-proxy:3128`）+ 自签 CA bundle |
| 浏览器 | computer-use 由 exec-daemon + 桌面栈承担 | `browser-broker` 租 VM 浏览器，与 exec 面分离 |
