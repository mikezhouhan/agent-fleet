# exec-daemon（本机 Grok Bot box）

## 包身份（证据）

`/exec-daemon/package.json`：

```json
{
  "name": "@anysphere/exec-daemon-runtime",
  "private": true,
  "gitCommit": "unknown",
  "buildTimestamp": "2026-09-16T22:31:13.603Z"
}
```

与 Cursor Cloud Agent 镜像内的 exec-daemon **同属 Anysphere 运行时**；本 box 将其端口与监督方式改造成 sand 多窗契约。

## 主实例 argv（证据）

`/usr/local/bin/start-exec-daemon`：

```bash
unset SAND_GATEWAY_TOKEN SAND_INFERENCE_RENEWAL_CREDENTIAL SAND_EGRESS_TUNNEL_BEARER
export CURSOR_AGENT_SOCKET=/tmp/sand-identity.sock
cd /workspace && /exec-daemon/exec-daemon serve \
  --port 1337 --pty-websocket-port 1338 \
  --auth-token local --rg-path /exec-daemon/rg \
  --pty-auth-token local-pty \
  --computer-use-enabled --computer-use-lazy-init \
  --mcp-meta-tool-enabled --origin-cli-enabled
```

要点：

- 故意 **剥离** 网关/隧道/推理续期凭证，避免工具子进程继承。
- `CURSOR_AGENT_SOCKET` 指向 `/tmp/sand-identity.sock`（本 run 存在），不是 Cursor Cloud 常见的 `/run/cursor/api.sock`。
- 由 `supervise-exec-daemon` 守护；OOM score `-1000`。

## Fork 窗实例（证据）

`/usr/local/bin/start-window <display> [ownerToken]`：

| 项 | 公式 |
| --- | --- |
| exec-daemon | `14000 + display` |
| Pty WS | `13600 + display` |
| VNC | `5900 + display` |
| 拒绝占用 | exit `75`（不同 owner token） |

本 run 实测：`:6 → 14006/13606`，`:7 → 14007/13607`。

## 与 Cursor Cloud 端口对照

| 角色 | Cursor Cloud（us4p 样本） | Grok Bot sand box（本 run） |
| --- | --- | --- |
| ControlService HTTP | `:26053` | 主 `:1337`；fork `:14000+N` |
| PtyHost WS | `:26054` | 主 `:1338`；fork `:13600+N` |
| 远程 workbench | `:26055` cursor-server | **未见**独立 cursor-server；host-main 承担产品宿主 |
| noVNC | `:26058` | 主 `:6080`；fork token `:6081` |
| VNC | TigerVNC `:5901` | x11vnc `5900+N` |
| 窗路由 | 无（单 agent / 单桌面） | `:1339` `sand-window-router` |
| Agent host gateway | 控制面外置 | `:1340` `host-main.cjs` |

## 目录布局（证据）

与 Cursor Cloud 类似：`index.js`（大 webpack）、`node`、`rg`、`gh`、`tmux*`、`cursorsandbox`、`agent-sdk/`、`canvas-runtime/`、`tools/origin`。

本 run **未**把 cursorsandbox 作为默认沙箱开关打开（argv 无 `--sandbox-enabled`）。
