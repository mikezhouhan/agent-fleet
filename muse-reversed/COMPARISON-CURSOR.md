# Cursor Projects vs Muse 2.0（客户端证据）

> 本文只比 **桌面客户端**。云端循环、Postgres、Noise、与 Cursor Cloud Agents 的对照见
> [../analysis/muse-vs-cursor-cloud-agents.zh-CN.md](../analysis/muse-vs-cursor-cloud-agents.zh-CN.md)
> 与 [../analysis/muse-implementation-architecture.zh-CN.md](../analysis/muse-implementation-architecture.zh-CN.md)。

Muse 是 Meta **Endo/Hatch** 桌面壳（`com.meta.endo`）：Swift Mach-O + Chrome 扩展「Muse Browser Node」+ 内嵌 Hatch Web（CVM）。Planner 在 `hatch.metaaivm.com`，不在本 DMG 的 Swift 源码里。

## 执行隔离

| | Cursor Projects | Muse 2.0 |
| --- | --- | --- |
| 云沙箱 | `new_cloud_vm` + `/workspace` | Hatch CVM：`HATCH_SHARED_LB_HOST=hatch.metaaivm.com`，Noise `wss://…/v1/noise`；GK `hatch_web:hatch_web_cvm` / `hatch_reset_vm` |
| 本机 | `cursor-agent-exec` | Swift `ComputerControl` / `BackgroundComputerControl` + Chrome CDP 扩展 |

**Cursor：** `cursor-projects-reversed/recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/cloudAgentEnvironment.js`

**Muse：** `recovered/sandbox/hatch__index.html/hatch.metaaivm.com.slice.js`；`recovered/sandbox/hatch__index.html/hatch_web-hatch_web_cvm.slice.js`；`recovered/sandbox/hatch__metaconfig.json/metaconfig.json`；`recovered/session/MacOS__Muse/endo-swift-types.txt`（`SandboxSchemeHandler`）

## Skills

Cursor：Agent Store `skills/` + `.cursor/skills`。  
Muse：Hatch bundle 里出现 `SKILL.md`（含 red-team mock CLI 文案）；无桌面 skill 目录扫描器。

**Cursor：** `cursor-projects-reversed/recovered/agent_store/out__vs__workbench__workbench.glass.main.js/agent-store-ids.ts`  
**Muse：** `recovered/skills/hatch__index.html/SKILL.md.slice.js`

## MCP

Cursor：`.cursor/mcp.json` + environment allowlist。  
Muse：**缺口** — 无 `mcp_servers.json`。Swift 有 `mcpSetup` ivar，不是一等配置文件。

**Cursor：** `cursor-projects-reversed/recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/mcpService.js`

## 共享上下文

Cursor：Agent Store `/cursor/stores`。  
Muse：无对等网盘。会话树字段 `parent_agent_id` / `root_agent_id` 在 Hatch HTML；本机同步邮件/日历/Notes（`Endo*SyncSource`）。

**Cursor：** `cursor-projects-reversed/recovered/agent_store/out__vs__workbench__workbench.glass.main.js/agent-store-ids.ts`  
**Muse：** `recovered/session/hatch__index.html/parent_agent_id.slice.js`

## Session / 浏览器节点

Chrome 扩展把本机 Chrome 接到 Hatch（`agent.meta.ai` / `hatch.meta.ai` pairing，`chrome.debugger`）。

**Muse：** `recovered/computer/chrome__manifest.json/manifest.json`；`recovered/computer/chrome__background.js/background.js`；`recovered/computer/chrome__lib__commands.js/commands.js`；`recovered/computer/chrome__lib__cdp.js/cdp.js`

**缺口：** planner/executor 循环在 CVM（`hatch.metaaivm.com`），见 `inventory.json` gaps。
