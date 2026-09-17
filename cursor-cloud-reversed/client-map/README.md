# 客户端恢复切片 → Cloud / Local Agent 协同映射

仓库已有切片在 `cursor-projects-reversed/recovered/`（Cursor 3.20.17 macOS DMG）。下面只列 **控制面协同** 相关单元，不重复 CATALOG 全量。

## 控制面：创建 / 流式 / 仓库

| 恢复文件 | 架构角色 |
| --- | --- |
| `cloud_local_agents/.../cloudAgentRepositoryService.js` | 客户端 Cloud Agent 仓库：列表、启动、resume |
| `cloud_local_agents/.../cloudAgentRepositoryModel.js` | 仓库 UI 模型；含 `glass_cloud_meta_agents` |
| `cloud_local_agents/.../cloudAgentHandle.js` | 已加载 agent 句柄：`submitMessage`、queue、plan、PR actions；followup RPC `addAsyncFollowupBackgroundComposer` |
| `cloud_local_agents/.../loadedCloudAgent.js` | 运行中 agent：stream、workspace factory、PR state、idle |
| `cloud_local_agents/.../cloudAgentStream.js` | `streamConversation` 消费 |
| `cloud_local_agents/.../cloudAgentEnvironment.js` | Cloud 侧环境对象：`/workspace` 常量、slash/skills/MCP、`getBackgroundComposerSlashCommands`、`listWorkspaceFiles` |
| `cloud_local_agents/.../backgroundComposer.js` 等 | Background Composer 客户端（控制面 RPC 前缀） |

## 子 agent：同机侧聊 vs 新 VM

| 恢复文件 | 关键行为 |
| --- | --- |
| `cloud_local_agents/.../cloudSubagentRunner.js` | 本机 Task `environment:"cloud"`：`startBackgroundComposerFromSnapshot`，`source: AS_SUBAGENT_FROM_LOCAL`，**新建路径生成新 bcId 并请求独立云环境**；拒绝 `forkAgentId` / continuationConfig，但支持 `resumeAgentId` 并校验父会话归属 |
| `cloud_local_agents/.../cloudSubagentInfo.js` | 子 agent 元数据 / parent 绑定 |
| `cloud_local_agents/.../cloudAgentHandle.js` | `getHydrationSideChatSeedTurnCount`：侧聊从父 transcript 灌种子，**不是**新 VM |

本侧聊实测：`CURSOR_CONVERSATION_ID=bc-8d255668-…` 而 exec-daemon/FUSE 的 `bc_id=bc-49d992a3-…`。侧聊 = 同一 Pod 上的第二条对话，不是 `cloudSubagentRunner` 那条「新 VM」路径。

## Local Agent（对照）

| 恢复文件 | 架构角色 |
| --- | --- |
| `.../localAgentEnvironment.js` | 本机 agent 环境 |
| `.../localAgentRepository.js` | 本机 agent 仓库 |
| `.../localAgentGatewayConfiguration.js` | 本机 gateway |
| `.../lazyLocalAgentEnvironment.js` | 延迟加载 |
| `extensions/cursor-always-local/` | Always-local 扩展、`environment.schema.json` |

## Environment 配置面（客户端 schema）

`cursor-projects-reversed/recovered/cloud_local_agents/extensions__cursor-always-local__schemas__environment.schema.json/environment.schema.json`

字段与公开文档一致：`install` / `start` / `terminals` / `snapshot` / `build` / `image` / `egressMode` / `mcpServerAllowlist` / `ports`。`install` 描述写的是 “VM startup (after pulling latest changes)”——**无 Build 路径**；有 Build 时文档改为 Build 阶段跑 install、agent 启动只跑 start/terminals。

## 公开控制面 RPC 名（从客户端字符串）

- `StartBackgroundComposerFromSnapshot`
- `AddAsyncFollowupBackgroundComposer`
- `SubmitPendingFollowupNow`
- `GetBackgroundComposerInfo`
- `streamConversation`
- `getRepositoryBranches`
- `listWorkspaceFiles`
- `getBackgroundComposerSlashCommands` / `getRepoSlashCommands`
- `getAvailableMcpServers` / `checkHttpMcpStatus` / `updateUserDefaultMcpSettings`
- `getManagedSkills` / `getCloudAgentPluginsSnapshot`

2026-09-17 深入分析见[本地与云端架构报告](../../analysis/cursor-local-cloud-architecture.zh-CN.md)。本地完整分发包补充符号与哈希见 [local-runtime-evidence.json](local-runtime-evidence.json)。
