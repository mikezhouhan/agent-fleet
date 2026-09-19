# Cursor Projects vs Manus 1.7.6（客户端证据对照）

对照范围：`cursor-projects-reversed/`（Cursor 3.20.17）与本目录从 `Manus-Setup-1.7.6.dmg` 恢复的桌面单元。云端 hypervisor、Manus planner 循环、Cursor coordinator 服务端均标为 **DMG 缺口**，不编造。

## 1. 执行隔离（sandbox / VM vs 本机）

| | Cursor Projects | Manus 1.7.6 |
| --- | --- | --- |
| 云执行 | `TargetMachine.new_cloud_vm`，VM 内 `/workspace` | 远程 sandbox 通过 `sandboxWsUrl`（`wss://api.manus.im`）接入；桌面 **不** 起本地 hypervisor |
| 本机执行 | `same_machine` + `cursor-agent-exec` / daemon | `sidecar` 进程 + `manus-computer-operator` + Computer Use helper |
| 工作副本 | `.cursor/worktrees` 或云 `/workspace` | `Documents/manus-auto-workspace`（`AUTO_WORKSPACE_ROOT_DIRNAME`） |

**Cursor 证据：** `cursor-projects-reversed/recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/cloudAgentEnvironment.js`；`cursor-projects-reversed/recovered/cloud_local_agents/extensions__cursor-always-local__schemas__environment.schema.json/environment.schema.json`

**Manus 证据：** `recovered/session/dist__myComputerService__SessionSupervisor.js/SessionSupervisor.js`（`sandboxWsUrl` + sidecar）；`recovered/sandbox/dist__computerUse__autoWorkspaceManager.js/autoWorkspaceManager.js`；`recovered/sandbox/Resources__addons__manus-computer-use__1.0.5__addon.json/addon.json`（本机屏幕/键鼠，不是云 VM）

**缺口：** Manus 远程 VM 的创建/回收不在本 DMG。Cursor 云 VM 生命周期 RPC 也不在 Manus 树。

## 2. Skills

| | Cursor | Manus |
| --- | --- | --- |
| 格式 | 多根目录 `.cursor/skills`、Agent Store `skills/`、`SKILL.md` | 前端要求 `.zip` / `.skill` **根目录含 SKILL.md** |
| 加载 | `getAgentStoreSkillRoots`、仓库扫描 | 桌面 `SkillRecordingClient` 把本机操作录成 artifact 挂到任务 |
| 录制 | 无对等 desktop recorder addon | addon `skill-recorder`，MCP server 名 `skill-recorder` |

**Cursor 证据：** `cursor-projects-reversed/recovered/agent_store/out__vs__workbench__workbench.glass.main.js/agent-store-ids.ts`

**Manus 证据：** `recovered/skills/frontend__out___next__static__chunks__03oh5d5w-5369.js/SKILL.md.slice.js`；`recovered/skills/dist__computerUse__skillRecordingClient.js/skillRecordingClient.js`；`recovered/skills/Resources__addons__skill-recorder__1.0.0__addon.json/addon.json`

## 3. MCP

| | Cursor | Manus |
| --- | --- | --- |
| 配置层 | 用户/仓库 `.cursor/mcp.json` + team + `environment.json` 白名单 | `~/.config/manus-computer-operator/mcp_servers.json`（`OperatorMcpConfig.write`） |
| 本机 MCP | 扩展 MCP 进程 | Computer Use / Skill Recorder 以 **socket MCP** 暴露 |
| 云 MCP | 云环境 allowlist / disableAllMcpServers | 本 DMG 无云 MCP 策略文件 |

**Cursor 证据：** `cursor-projects-reversed/recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/mcpService.js`；`cursor-projects-reversed/recovered/cloud_local_agents/extensions__cursor-always-local__schemas__environment.schema.json/environment.schema.json`

**Manus 证据：** `recovered/mcp/dist__computerUse__operatorMcpConfig.js/operatorMcpConfig.js`；`recovered/mcp/dist__ipc__handlers__localMcp.js/localMcp.js`；两份 addon.json 的 `"mcp": { "server": "computer-use"|"skill-recorder" }`

## 4. 共享文件系统 / 上下文

| | Cursor | Manus |
| --- | --- | --- |
| 权威共享盘 | Agent Store `/cursor/stores/{user,team,agent}`，VM 回收后仍在 | **无** 对等 Store。共享的是 sidecar 的 `folderPath`（本机目录同步到远程 sandbox） |
| 任务板 | `tasks.md` / `notes.md` 在 Store | 不在桌面 dist；任务状态走 `wss://api.manus.im` |
| 文件交接 | Store mount / PR | `fileGrant` / `localFileHandoff` |

**Cursor 证据：** `cursor-projects-reversed/recovered/agent_store/out__vs__workbench__workbench.glass.main.js/agent-store-ids.ts`；`cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/agentProjectService.js`

**Manus 证据：** `recovered/session/dist__myComputerService__SessionSupervisor.js/SessionSupervisor.js`（`folderPath` + `sandboxWsUrl`）；`recovered/sandbox/dist__fileGrant__localFileHandoff.js/localFileHandoff.js`

**缺口：** Manus 云端对象存储/任务板 schema 不在本 DMG。

## 5. Session / 任务生命周期

| | Cursor | Manus |
| --- | --- | --- |
| 树 | Project 根 + worker membership | 桌面 `SessionSupervisor` 按 `sessionId` reconcile sidecar 子进程 |
| 状态 | CREATING/RUNNING/IDLE/ARCHIVED/EXPIRED | sidecar `connected` / `error` + 重试（最多 20 次） |
| Planner | Coordinator 工具 TASK/CREATE_AGENT（服务端循环是缺口） | 前端 `selectPlannerVisible`；**planner/executor 循环不在 dist/** |
| 控制面 | Pause/Resume/Archive RPC | `MyComputerService.start/stop` + sidecar spawn/kill |

**Cursor 证据：** `cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/agentProjectService.js`

**Manus 证据：** `recovered/session/dist__myComputerService__SessionSupervisor.js/SessionSupervisor.js`；`recovered/session/dist__myComputerService__myComputerService.js/myComputerService.js`；`recovered/session/frontend__out___next__static__chunks__0y7veusby6y8q.js/selectPlannerVisible.slice.js`；`recovered/session/dist__env.js/env.js`（`chatWebsocketUrl: wss://api.manus.im`）

**缺口（inventory.gaps）：** planner/executor loop — 桌面只有 UI 可见性与 websocket；循环在服务端。

## 6. 一句话

Cursor Projects 是 **IDE 内的多 agent 树 + 独立 Agent Store + 可选云 VM**。  
Manus 1.7.6 桌面是 **薄壳**：本机 sidecar/operator 把文件夹和键鼠接到 **云 sandbox websocket**；技能录制与 MCP 是本机 helper；规划循环不在安装包里。
