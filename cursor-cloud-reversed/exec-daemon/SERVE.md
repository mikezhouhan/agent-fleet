# exec-daemon serve 能力面（本 run 实测）

包装器 `/exec-daemon/exec-daemon` 是 bash：`exec "$NODE_BIN" "$SCRIPT_DIR/index.js" "$@"`。

捆绑包身份：

- npm name: `@anysphere/exec-daemon-runtime`
- buildTimestamp: `2026-09-16T10:51:59.645Z`
- tarball: `exec-daemon-x64-538322a2e0847c5238327ddad94b983dea9f63e1-bk.tar.gz`

## 子命令

| 命令 | 作用 |
| --- | --- |
| `serve` | 默认。启动 ControlService HTTP + PtyHost WebSocket |
| `refresh-git-token` | 刷新 git config 里的 GitHub token 后退出 |
| `prebuild-request-context-cache` | Environment Build 末尾把 RequestContext 写到 `/opt/cursor/.exec-daemon/request-context-cache.json` |

## 本 run 实际 argv（token 已脱敏）

```
/exec-daemon/node /exec-daemon/index.js serve
  --port 26053
  --pty-websocket-port 26054
  --auth-token [REDACTED]
  --rg-path /exec-daemon/rg
  --pty-auth-token [REDACTED]
  --cloud-rules-enabled
  --computer-use-enabled
  --computer-use-lazy-init
  --trace-endpoint https://api2.cursor.sh
  --trace-auth-token [REDACTED]
  --trace-attributes runner_cluster=us4p,anyrun_cluster=us4p,tenant_id=aec3d4a70ee7629df4bc,pod_name=exec-daemon,bc_id=bc-49d992a3-8543-4f6b-9d1e-618935e8d3b6
  --ghost-mode true
  --browser-enabled
  --computer-use-enabled
  --record-screen-enabled
  --generate-image-enabled
  --origin-cli-enabled
  --mcp-meta-tool-enabled
  --mcp-meta-tool-slim-descriptors
  --mcp-input-schema-json
  --strip-agent-skill-content
  --filter-model-disabled-skills
  --tmux-service-enabled
  --nested-claude-hook-output-normalization-enabled
  --command-hook-stdin-transport-enabled
```

注意 `--trace-attributes` 里的 `bc_id` 是 **父会话** `bc-49d992a3-…`，不是侧聊 `bc-8d255668-…`。`--ghost-mode true` 会关掉 OpenTelemetry 上报（help 原文：Enable ghost/privacy mode (disables tracing)）。

## setupDaemon 关键开关（从 runServer 抽出）

`surface: "cloud"`。`isSecretRedactionEnabled: true` 写死。`getThirdPartyExtensibilityEnabled` 绑定 `--claude-md-enabled`（默认 true）。

## 捆绑二进制

| 路径 | 作用 |
| --- | --- |
| `node` | Node 运行时（本机 `node -v` = v22.14.0 是系统/镜像的；daemon 用自己的 120MB node） |
| `rg` | ripgrep，对应 Cursor 工具 `Grep` |
| `gh` | GitHub CLI |
| `tools/origin` | Origin CLI（`--origin-cli-enabled` 时 prepend PATH） |
| `tmux` + `tmux-root/` + `tmux.portal.conf` | 门户 tmux |
| `cursorsandbox` | 沙箱 helper（本 run **未** 开 `--sandbox-enabled`） |
| `ssh-keygen` | 提交签名相关 |
| `pty.node` / `polished-renderer.node` | native addons |
| `agent-sdk/` | canvas SDK |
| `canvas-runtime/` | computer-use / canvas |
