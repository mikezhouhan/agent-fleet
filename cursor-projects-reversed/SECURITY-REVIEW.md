# Cursor Projects 客户端安全观察（Cursor 3.20.17 / darwin-arm64）

本文是对 **本 DMG 内已恢复客户端单元** 的证据观察，供安全团队对照公司规范审查。仓库中 **没有** 公司规范文本，因此 **不** 出具合格/不合格证书，也不把缺失的服务端实现写成“已验证控制”。

范围：`/Users/jasper/Downloads/Cursor-darwin-arm64.dmg`（SHA-256 `a3cf86050ea4c322b8a63fa840f35a54318c46da9b33281c2b223a17e473c738`）。云端 coordinator 运行时、每 agent VM、Slack/Git 投递管道若不在客户端 payload 中，记为缺口。

符号与路径以 `inventory.json` 为准。下文以 `recovered/` 开头的路径均为 recover 入口写出的切片/副本。

---

## 1. Coordinator（计划/委派，不自己写代码）

**客户端存在。** Glass UI 把部分 composer 标成 Project coordinator。

| 观察 | 证据 |
| --- | --- |
| `isProjectCoordinator` 参与提交/中断策略（`glass_projects_prefer_interrupt`） | `recovered/coordinator/out__vs__workbench__workbench.glass.main.js/isProjectCoordinator.slice.js`；模块 `glass-prompt-submit-validation.js`、`isComposerProjectAgent.js` |
| 本地/云端 Project 登记存在 VS Code storage key | `recovered/coordinator/out__vs__workbench__workbench.glass.main.js/agentProjectService.js` 中 `glass.localAgentProjects.v1`、`glass.localAgentProjectMembership.v1`、`glass.cloudAgentProjects.v1`、`glass.cloudAgentProjectMembership.v1`、`agentProjectServiceFacade` |
| 子 agent 委派与 worker 成员 | `create-project-dialog.react.js`、`project-subagent-roster.js`、`projectWorkerMembership.js`、`coordinatorAgentTaskProjection.js`、`coordinator_tools_pb.js` |
| Host daemon 出现 `CursorProject` | `recovered/coordinator/extensions__cursor-agent-host__dist__agent-host-daemon__dist__bin__daemon.cjs/CursorProject.slice.js` |

**缺口（不在本 DMG）：** coordinator 实际规划循环、工具编排、“不写代码”的服务端强制。客户端只有 UI 角色与 RPC/proto 名称（如 `CreateProjectSubagent`、`CreateProjectWorker`）。不能仅凭客户端证明云端 coordinator 不会改仓库。

---

## 2. 出站：什么代码/上下文离开本机

**客户端存在出站面；服务端处理不在本 DMG。**

| 观察 | 证据 |
| --- | --- |
| 主 API `https://api2.cursor.sh`（startup / tray cloud list） | `out/main.js` 分类命中；`product.json` `updateUrl` |
| 会话摄入 `aiserver.v1.IngestConversationRequest` 字段含 `transcript` / `transcript_json` | `recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/analytics_pb.js`；`recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/analytics_connectweb.js`（`ingestConversation` RPC）；`recovered/cloud_local_agents/out__main.js/IngestConversationRequest.slice.js` |
| Cloud agent 提示上传（`promptUploadRef` / S3 multipart；空 factory `cloudAgentPromptUpload.js` 不作为证据） | `recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/pendingReadOverride.js`；`recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/promptUploadRef.slice.js` |
| 云环境会为依赖仓库生成 GitHub access token | `recovered/cloud_local_agents/extensions__cursor-always-local__schemas__environment.schema.json/environment.schema.json` 字段 `repositoryDependencies` |
| 云环境出站：`egressAllowlist` / `egressMode`（`allow_all` 可关掉限制，仍受 team policy） | 同上 schema |
| MCP OAuth 回调 `https://www.cursor.com/agents/mcp/oauth/callback` 与 `cursor://anysphere.cursor-mcp/oauth/return` | Glass `oauth` 字符串；`cloudMcpOAuthFlowState` 同类模块在 glass 中 |
| 错误遥测 DSN 指向 `metrics.cursor.sh` | Glass 字符串 `https://80ec2259ebfad12d8aa2afe6eb4f6dd5@metrics.cursor.sh/4508016051945472` |
| 产品文案：选择第三方模型时 prompts 与有限遥测会共享给模型供应商 | Glass onboarding 字符串 `Prompts and limited telemetry may also be shared with model providers...`；`product.json` `enableTelemetry: true` |
| Cloud agent 出站保护枚举 `CloudAgentEgressProtectionMode` | `workbench.desktop.main.js` / `out/main.js` 分类符号 |

**缺口：** 实际上传到 `api2.cursor.sh` 的字段集、是否默认发送完整仓库、云 VM 的强制 egress，均不在客户端。`egressMode=allow_all` 的最终是否被 team policy 挡住是服务端问题。

---

## 3. 存储：共享上下文与 transcript 在哪

**客户端有本地路径与 storage key；跨机器同步的权威存储是服务端。**

| 观察 | 证据 |
| --- | --- |
| 应用数据目录 `.cursor` | `product.json` `dataFolderName`；`provenance.json` |
| Project 列表/成员存在 application storage | `agentProjectService.js` 的 `glass.*AgentProjects.v1` keys |
| 本机 agent 存储服务 | `recovered/cloud_local_agents/out__vs__workbench__workbench.desktop.main.js/localAgentStorageService.slice.js` |
| Transcript 路径与磁盘用量监控 `agentTranscriptsDir` / `projectsDir` | `recovered/shared_context/out__vs__workbench__workbench.glass.main.js/transcriptPaths.js`；Glass 字符串 `[DiskUsageMonitor] Could not resolve project dir for agent-transcripts` |
| 云 transcript 本地索引 worker | shipped `out/vs/workbench/services/agentData/browser/cloudAgentTranscriptIndexWorkerMain.js`；符号 `cachedCloudTranscriptIndexCoordinator` |
| 项目 notes / context 内容 | `projectContextContent.js`、`project-notes-document.react.js`、`project-notes-only-context-toggle.react.js` |
| PR 调查把 `<pr_shared_context>` 嵌入子 agent 提示（含 diff 元数据，指示不要再 `gh pr view`） | `recovered/shared_context/out__vs__workbench__workbench.glass.main.js/pr_shared_context.slice.js` |
| 工作区文件 `.cursor/environment.json`、`.cursor/permissions.json`、`.cursor/mcp.json`（mcp.json 写入后 `chmod` 384 = 0600）、`.cursor/worktrees` | always-local `package.json` jsonValidation；`out/main.js` mcp chmod；`kK=".cursor/worktrees"` |
| 共享会话文件监视 gate `cursor.sharedSessionFileWatcher.enabled` | Glass 分类符号 |

**缺口：** “共享上下文文件在云与本地机器间同步”的服务端 store、冲突合并、加密 at rest **未**出现在本 DMG。客户端只展示 notes/context UI、PR 预取块、以及本地 `.cursor/` 与 storage key。

---

## 4. 密钥 / Token / OAuth

| 观察 | 证据 |
| --- | --- |
| VS Code `secretStorageService`，前缀 `secret://`，可走内存或加密后端；无磁盘存储时提示用户 | `recovered/shared_context/out__vs__workbench__workbench.glass.main.js/secrets.js`；字符串 `[NativeSecretStorageService] Notifying user that secrets are not being stored on disk.` |
| 云环境 secrets 编辑 UI | Glass 模块 `EnvironmentSetupSecretsEditorModal.js`、`env-setup-secret.js`、`secret-variable-names.js` |
| MCP OAuth：loopback `http://localhost:8787/callback`、自定义协议回调、Google Workspace MCP 主机表 | Glass oauth 切片（`cNb`/`Ytr`/`tlo="anysphere.cursor-mcp"`） |
| MCP OAuth store 键必须 unscoped：`MCP OAuth store keys must be unscoped` | Glass |
| 认证 `cursorAuthenticationService` / `cursorCreds` / `cursorCredsService.getBackendUrl()` | Glass |
| `.cursor/mcp.json` 权限 0600 | `out/main.js` |
| 云环境 GitHub token 范围随 `repositoryDependencies` 扩大 | `environment.schema.json` |

**缺口：** Token 在 Anysphere 后端的保管、刷新、是否写入云 VM 环境变量，不在本 DMG。客户端能证明有 secret storage API 与 OAuth 回调 URL，不能证明服务端密钥隔离。

---

## 5. 本机 Agent 如何在主机上执行

**客户端存在完整本地执行面（扩展 + daemon）。云 agent 默认；本地为需要时。**

| 观察 | 证据 |
| --- | --- |
| 扩展 `cursor-agent-exec`：在主机跑命令、文件、工具，带权限批准 | `recovered/cloud_local_agents/extensions__cursor-agent-exec__package.json/package.json` |
| `cursor-agent-host`：在 AgentExec extension host 编排；附带 `agent-host-daemon`（约 27MB `daemon.cjs`） | `cursor-agent-host/package.json`；`CursorProject.slice.js` |
| `cursor-local-agent-runtime`：在 workspace extension host **之外**跑 Private Inference | `cursor-local-agent-runtime/package.json` |
| `cursor-always-local` 激活 `onResolveRemoteAuthority:background-composer`，校验 `.cursor/environment.json` 与 `permissions.json` | always-local `package.json` |
| Auto-run：`approvalMode` = `allowlist` \| `unrestricted` \| `manual`；MCP/terminal allowlist | `recovered/shared_context/extensions__cursor-always-local__schemas__permissions.schema.json/permissions.schema.json` |
| 本机 gateway / environment / repository | `localAgentGatewayConfiguration.js`、`localAgentEnvironment.js`、`localAgentRepository.js` |
| Electron main 使用 `child_process` `fork`/`spawn`/`execSync` | `out/main.js` |
| 本地 Project 子 agent：`createProjectSubagent`、`reparentLocalAgentIntoProject`、`LocalAgentStoreIntoProject` | Glass / always-local marker window |
| Dedicated extension host：`LocalAgentInDedicatedExtensionHost` | Glass 符号 |

**风险含义（观察，非判定）：** 本机 agent 路径等于在用户机器上执行模型驱动的 shell/文件/MCP。`permissions.json` 的 `unrestricted` 与 `environment.json` 的 `egressMode=allow_all` 是企业策略应对齐的客户端旋钮。云路径把执行放到远端 VM（schema 含 `install`/`start` 脚本、Dockerfile、snapshot）。

**缺口：** 沙箱是否默认启用、macOS seatbelt/容器边界、daemon 与 IDE 的权限分离，需动态分析；本恢复只证明扩展与 daemon 已随安装包分发。

---

## 6. 订阅如何到达 Slack / Git / 调度器

**客户端有订阅源枚举、Slack 连接 UI、cron 展示；投递管道主要在服务端。**

| 观察 | 证据 |
| --- | --- |
| Proto `agent.v1.SubscriptionSource`：`UNSPECIFIED`、`SLACK`、`GITHUB`、`LINEAR`、`ORIGIN` | `recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/SUBSCRIPTION_SOURCE_SLACK.slice.js`；同样出现在 `cloudAgentTranscriptIndexWorkerMain.js` |
| 本地订阅 mailbox | `localSubscriptions.js`、`localSubscriptionMailbox.js` |
| Slack 连接：`cursor.connectSlack` 命令标题 `Connect Slack`，`getSlackInstallUrl` / `connect_slack_*` 日志 | `recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/aiSettingsService.js`；`recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/connect_slack.slice.js`；`recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/Connect-Slack.slice.js` |
| FSD Slack 工具文案 `set_slack_thread_status`（“Updated FSD Slack status”） | `recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/fsd-mcp-tool-description.js` |
| 调度：`CronSchedule`、`describeUtcCronSchedule`、`subscription-row.react.js` | `subscription-row.react.js` |
| Follow PR：GitHub subscription source + PR shared-context 调查流 | `SUBSCRIPTION_SOURCE_GITHUB`；`<pr_shared_context>` 切片 |
| UI：`subscriptions-tab-content.react.js`、`use-event-subscriptions.react.js`、`ComposerSubscriptionEvents.react.js` | 对应 recovered named modules |

**缺口：** Slack Bot 凭据、频道投递、GitHub webhook、cron 触发器的调度器 **不在本 DMG**。客户端负责绑定 UI、展示事件、把 mailbox 条目交给本地/云 agent。无法从客户端证明 Slack 消息体是否包含源码或密钥。

---

## 7. 明确不在本 DMG 的能力

- Cursor 云 coordinator 服务、每-agent VM hypervisor、共享上下文对象存储。
- Slack/GitHub/Linear 的服务器 webhook 处理器。
- `http://go/sourcemap/...` 源映射（内部 URL，安装包未带）。
- Windows/Linux 安装包。
- 对照未提供的公司《安全规范》的合规结论。

---

## 8. 审查时建议核验的客户端旋钮

这些是本 DMG **确实存在**、规范对照时应点名的配置面：

1. `.cursor/permissions.json` — `approvalMode=unrestricted` 与 MCP/terminal allowlist  
2. `.cursor/environment.json` — `egressMode`、`disableAllMcpServers`、`repositoryDependencies`（扩大 GitHub token）  
3. `.cursor/mcp.json` 权限 0600，但内容仍是本机可读的 MCP 配置  
4. `product.json` `enableTelemetry` 与 `statsigClientKey`（客户端埋点）  
5. 本机 `cursor-agent-exec` / `agent-host-daemon` 是否允许在受管机上运行  
6. Secret storage 失败时的内存回退（用户可见提示）  

每条都能在 `inventory.json` 中找到 shipped path。动态验证（实际发包、实际 token 落盘）超出本静态恢复。
