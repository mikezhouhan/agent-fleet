# sand-host / sand-supervisor

## sand-host 布局（证据）

`/home/box/sand-host/`：

| 路径 | 说明 |
| --- | --- |
| `version` | 短 git sha，本 run `18cd065` |
| `host-main.cjs` | ~26MB 打包宿主；gateway + agent loop |
| `sand-eval-runner.cjs` | ~18MB；浏览器/计算机评估侧车 |
| `box-scripts/` | 可热同步到 `/usr/local/bin` 的脚本子集 |
| `agent-isolation/` | `agent-store-worker` / `transcript-mirror-worker` |
| `extensions/` | `box-store-sync` / `codebase-telemetry` / `content-search` |
| `diff-*.js` / `pdf-worker*` | 工具 worker |

`package.json` 仅 `"type": "commonjs"`。

## 默认升级源（证据）

`sand-supervisor.mjs`：

```
HOST_BUNDLE_DEFAULT_BASE_URL =
  "https://public-asphr-vm-daemon-bucket.s3.us-east-1.amazonaws.com/sand-host-bundle"
```

频道：`latest` / `stable`（可用 `SAND_HOST_BUNDLE_CHANNEL` / `SAND_HOST_BUNDLE_S3_BASE_URL` 覆盖）。

命令种类：`ping` / `restart` / `upgrade`；升级模式 `bundle` | `image` | `restart`。

本 run `status.json`：`hostVersion=18cd065`，`lastCommandKind=upgrade`，`hostRunning=true`。

## gateway（证据，值脱敏）

`/home/box/sand-data/gateway.json` 形状：

```json
{
  "port": 1340,
  "pid": <number>,
  "startedAt": <ms>,
  "scheme": "http",
  "host": "0.0.0.0",
  "token": "<REDACTED>"
}
```

环境：`SAND_HOST_PORT=1340`，`SAND_GATEWAY_BIND_HOST=0.0.0.0`。

## host-main 字符串线索（证据 → 推断）

`strings host-main.cjs` 可见大量 `SAND_*` 常量、`AgentStore` / `CloudAgent` / `BackgroundComposer`、`sand-subagent-<uuid>`、`sand.cloud_agent.*` 日志标签、以及 `grokbot://` 不在二进制而在 `/home/box/reference`。

**推断**：箱内宿主与 Cursor Cloud Agent / sand 产品共用同一套 agent runtime 血缘；Grok Bot 桌面客户端通过 deep link 与设置页品牌化，运行时包名仍是 sand。

## 源码路径线索（证据）

多处脚本注释：

> from `sand/src/shared/box/box-contract.ts`；`pnpm --filter sand run gen:box-ports` / `gen:box-contract`

说明上游 monorepo 包名 **`sand`**，生成物进镜像 `/usr/local/bin/box-contract.generated.mjs`。
