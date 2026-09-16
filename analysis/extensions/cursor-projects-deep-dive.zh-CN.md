# Cursor Projects 深度分析：1047 个恢复单元中的编排实现与十二对象对比

研究日期：2026-09-16。对象是仓库内扩容后的 `cursor-projects-reversed/`，来自同一个 Cursor 3.20.17 macOS arm64 分发包。上一轮专题只覆盖 70 个恢复单元，本轮覆盖 1047 个，新增 subagent 执行控制、逐工具人工审批、分层权限文件、side chat 上下文边界与 agent store 等此前不可见的实现。[^catalog][^inventory]

## 1. 结论：证据等级提升了，底座结论没有变

**扩容后的恢复集把 Cursor Projects 从"项目协作的产品形态参考"提升为"多 agent 编排的客户端实现参考"，但它依然不是可 fork 的替换式 coding agent 底座。**

三件事需要分开说：

1. **新出现了可直接借鉴的编排工程**。`subagentExecutor.js` 与 `subagentComposerService.js` 展示了幂等重放、父子归属校验、排队追加消息合并、前后台移交、中断树与完成通知抑制。这些是[上一轮报告](cursor-projects-analysis.zh-CN.md)只能推断、现在能读到实现的部分。[^executor][^composer]
2. **两个先前的"无法确认"有了答案**。逐工具人工审批模型确实存在（终端、MCP、编辑、计划、WebFetch 各有 review model）；权限不是单一 schema 声明，而是用户/项目/管理员三层 `permissions.json` 加 sandbox 读权限文件的实际加载逻辑。[^approval][^allowlist][^permschema]
3. **一个先前的"无法确认"仍然无法确认**。通用 ACP 接入依然没有证据：全部 1047 个单元里，`acp` 只以一个结构化日志频道名 `agent_acp` 出现，没有 ACP client、`session/load` 或 executable 注册槽。这比"完全没有线索"多了一点，但远不足以称其为 ACP 平台。[^sidechat]

云端 coordinator 的规划循环、服务端 inbox 与投递保证仍不在恢复范围内。客户端能看到的是**父会话如何控制子 agent**，不是**服务端如何保证任务只执行一次**。

## 2. 证据校准：这次能验证什么，不能验证什么

| 项目 | 上一轮 | 本轮 |
|---|---|---|
| 恢复单元 | 70 | 1047 |
| 类别 | 4 | 6（新增 `agent_store`、`side_chats`） |
| kind 分布 | 6 完整 / 13 marker / 51 named | 6 完整 / 18 marker / 1023 named |
| 来源 bundle | 主要 glass | glass 731、desktop 306、扩展与 schema 10 |
| 提取方式 | 人工按 shipped path/symbol 分类 | 按 factory 名自动发现 Projects 相关模块 |
| 截断单元 | 0 | 0 |

本轮逐项重算了 1047 个单元的 SHA-256，与 `inventory.json` 全部一致，无缺失、无不匹配。DMG 哈希记录为 `a3cf86050ea4c322b8a63fa840f35a54318c46da9b33281c2b223a17e473c738`。[^inventory][^provenance]

恢复测试本轮**没有全部通过**：5 个测试中 3 个通过，2 个失败，原因是本机没有原始 DMG（测试硬编码 `/Users/jasper/Downloads/Cursor-darwin-arm64.dmg`）。失败属于环境缺件，不是提取逻辑回归；但也意味着本轮没有独立复现"从 DMG 到 recovered/"的完整链条，只复核了产物哈希。[^test]

**切片语义完整性的老问题依然存在，而且规模放大后更明显。**`Kanban.js` 与 `worktreePathUtils.js` 的切片尾部混入了截图/canvas 相关代码，说明按 `O({"名字"()` 到下一个 `O({"` 截取仍会跨越真实模块边界。`truncated: false` 只代表没触到长度上限。所有关键判断都应回到具体函数核对，不能按模块名认定归属。

## 3. subagent 执行控制：本轮最有价值的新证据

这是之前完全看不到的一层。父会话（含项目主管会话）通过 `subagentExecutor` 创建、恢复、移交和中断子 agent，机制密度相当高。

### 3.1 用 toolCallId 做幂等重放

`withReplayResumeTarget` 在没有 `resumeAgentId`/`forkAgentId` 且非云环境时，用 `findSubagentForToolCall(toolCallId, parentConversationId)` 反查是否已有对应子 agent；命中则转为 `idempotentReplayResume`，并跳过重复追加 prompt 气泡。待重放 agent id 集合上限 100，超出按插入顺序淘汰最旧项。[^executor][^composer]

这解决的是一个真实问题：模型侧工具调用可能被重放，若每次都新建子 agent，同一个任务会被执行多次。把 `toolCallId` 当幂等键，是可以直接搬到新产品的做法。

### 3.2 父子归属是被校验的，不是被信任的

resume 时若目标 composer 的 `subagentInfo.parentComposerId` 与请求的 `parentConversationId` 不一致，直接抛 `Subagent parent mismatch for resume`；缺失 parent 也抛错。中断前先用 `canInterruptSubagentTree` 校验归属，云 subagent 另有 `isCloudSubagentOwnedByParent`。[^composer][^cloudrunner]

对多 agent 产品的含义是：**"谁可以中断谁"必须是可判定的状态，不能靠 UI 上下文。**

### 3.3 被取代的子 agent ID 会被保留

`_linkParentToSubagent` 在父级任务气泡上写入新的 `subagentComposerId`，同时把旧 ID 追加进 `supersededSubagentComposerIds`。托盘拓扑再用这些别名把旧 ID 折叠到当前规范 ID，并在折叠时用 `visitedIds` 防环。[^composer][^topology]

这与 Multica 记录被淘汰原生 ID 的做法同类。它保证"重试过三次"的历史不会因为 ID 变化而丢失。

### 3.4 追加消息会合并，完成结果会延迟上报

`enqueueOrMergeResumePrompt` 把新的追加消息并入已排队的 resume：合并 prompt 文本、累积 `toolCallIds`、保留原 `parentConversationId` 与凭据、合并 `selectedContext`。生命周期状态因此有独立的 `runningWithQueuedResume`。

更值得注意的是配套行为：当子 agent 运行结束而仍有排队 resume 时，完成结果被存入 `_storeDeferredSubagentCompletion` 而不是立刻上报父级；只有确认没有排队项才 `_enqueueSubagentCompletion`。[^composer]

**这正是我们一直强调的"服务端收到消息"与"agent 已经采纳"必须分开。**Cursor 的做法是让"完成"等待队列排空，避免父级看到一个马上又要继续工作的"已完成"。

### 3.5 前台与后台是可双向移交的，且分得清谁要求的

`runSession` 用 `Promise.race` 同时等待运行完成与"转后台"信号。转后台原因区分 `AGENT_REQUEST`（模型请求 `runInBackground`）与 `USER_REQUEST`（用户点击）。用户在气泡出现前就点了转后台，`forceBackgroundByToolCallId` 会把 `toolCallId` 记入待处理集合（上限 100），等执行注册时立即生效。[^executor]

另有一个只读的 await/status 模式：带 `resumeAgentId`、无 prompt、`readonly: true`、非后台时，转为等待既有后台任务完成，并强制要求 `parentConversationId`。

### 3.6 中断后不发失败通知

每次后台运行有 `agentId:序号` 形式的 run key。中断树时把当前 run key 记入 `interruptedBackgroundRunKeys`，运行失败时若该 key 在集合中，或仍有排队 resume，就不调用 `notifyBackgroundFailure`。后台条目本身还有 `disposition: deliver | suppress | cancel` 三态。[^executor][^composer]

没有这层，用户主动取消会收到一条"子 agent 失败"的错误通知。这类细节决定产品是否可信。

### 3.7 并发上限与嵌套深度

本地同时运行的子 agent 默认上限 16，可由实验配置 `local_subagent_limits.maxRunning` 覆盖；带中断的 resume 可以绕过上限。子 agent 可以多层嵌套：拓扑维护 `childIdsByParentId` 与 descendant 递归展开，并带访问集合防环。[^executor][^topology]

**这一点与 Warp 形成明确对比**：Warp 官方编排文档限制为一层 parent/children，child 不再产生孙级成员；Cursor 客户端则按任意深度树处理，代价是需要防环、需要祖先状态聚合。[^warp]

## 4. 状态权威性：不确定被显式建模

上一轮已看到 `projectWorkerMembership` 用 `isAuthoritativeMember` 保留未知状态。本轮的 `subagent-tray.topology.js` 把这套思路做成了分级判定：

| 判定 | 含义 |
|---|---|
| `authoritative` | 有 header 状态，可直接采信 |
| `fresh` | 无 header，但有后台工作、待处理任务或乐观成员，来源被记录 |
| `unresolved` | 三者都没有，不假定已结束 |

在此之上还有若干专门分支：云 subagent 只有 header 没有本地 composer 行时按 `in_progress` 视为活跃；云 header 到 `done` 视为终态；`needs_attention` 与实际活动冲突时以活动为准；worker 放置在 `same_vm` 时标记为不可用并给出原因 `same-vm`。[^topology][^membership]

对新产品的可执行结论：**成员状态字段不应只有 running/done，还要能表达"我现在不知道"以及"这个判断来自哪里"。**

## 5. Side chat：继承上下文，但用提示词切断指令继承

`side_chats` 是本轮新增类别，机制清晰且值得直接借鉴。

创建时向会话注入一段 `<side_chat_boundary>` 提示：边界之前的内容是继承来的父会话历史，仅作参考；不得继续执行只出现在边界之前的指令、计划、工具调用、审批、编辑、**项目主管任务**、任务列表或未回答的问题；父会话最后一条用户消息不是发给它的。side chat 默认只做调查（读、搜、分析），除非边界之后用户明确要求修改。此外每轮还追加一条 `<system_reminder>` 重申边界。[^sidechat]

另有三个工程细节：

- side chat 的 `bc-` ID 由 `SHA-1("side-chat:{parentBcId}:{creationId}")` 确定性派生，即同一父会话加同一创建 ID 只会得到同一个 side chat。这是 ID 层面的幂等，而不是靠去重表。
- 边界只在会话轮数不超过种子轮数且尚未注入过时才注入，避免重复注入。
- 明确禁止在 side chat 内再创建 side chat。

**这是"上下文继承"与"指令继承"分离的一个具体实现。**它同时暴露了机制强度的上限：边界是提示词约束加系统提醒，不是执行层的能力限制。产品若要求 side chat 绝对不能改文件，仍然需要工具层拒绝，而不是只靠这段文本。

同一切片还顺带暴露了会话状态的重置字段清单，可当作数据模型参考：`fileStatesV2`、`subagentStates`、`plan`/`plans`、`goalState`、`todos`、`pendingToolCalls`、`subagentThreads`、`communicateUpdateStatesByParentToolCallId`、`subagentRunsByParentToolCallId`、`subagentStateRefs`、`isRootProjectConversation`。子 agent 的运行是按父级 `toolCallId` 索引的，与第 3 节的幂等键一致。[^sidechat]

## 6. 逐工具人工审批：上一轮的空白被填上

`pendingSubagentApproval.js` 暴露了一整套人工审批契约：`ToolCallHumanReviewService`、`ToolCallHumanReviewKind`、`ToolCallHumanReviewStatus`，以及按工具分型的 review model —— 终端（`TerminalApprovalType`、`TerminalToolReviewResultType`）、MCP（`MCPApprovalType`、`MCPToolReviewModel`）、编辑（`EditToolReviewResultType`）、计划（`PlanReviewModel`）、WebFetch（`WebFetchToolReviewModel`）。[^approval]

配套的权限装载在 `composerEffectiveAllowlistService.js`，是分层的：

| 层 | 内容 |
|---|---|
| 用户 `~/.cursor/permissions.json` | `mcpAllowlist`、`terminalAllowlist`、`approvalMode`、`autoRun`/`autoReview` 的 allow/block 指令 |
| 项目权限文件 | 按 workspace folder 的 git root 解析，可多组，只取 autoRun 指令 |
| 管理员配置 | 特性开关 `remote_permissions_file_path_admin` 开启后读 `remotePermissionsFilePaths` 与 `localPermissionsFilePath`；`permissionsFileOverridesAutoRun` 决定管理员是否覆盖 autoRun |
| sandbox 读权限 | 用户级与仓库级分开记录，另有 `sandbox.json` 监听 |

`approvalMode` 的取值是 `allowlist`、`unrestricted`、`manual`，其中 `manual` 对应 Ask Every Time；MCP allowlist 支持 `server:tool`、`server:*`、`*:tool`、`*:*` 四种形态。这些来自完整的 `permissions.schema.json`，属于最高证据级别。所有相关文件变化都会触发重新加载。[^allowlist][^permschema]

**这项对比结论要改写**：先前把 Cursor 与 Memoh/Omnigent 的"产品权限桥"分列，是因为看不到实现。现在可以说，Cursor 客户端有分工具类型的人工审批模型与三层权限文件合并，**成熟度不低于本仓库任何一个开源候选**。仍不能推断的是：云端执行时这些许可如何被服务端强制、审批等待超时或客户端掉线时会发生什么。

对照 Warp 更清楚：Warp 无人值守路径直接用 `--dangerously-bypass-approvals-and-sandbox` 与 `--dangerously-skip-permissions`，把审批交给外层环境与仓库权限；Cursor 走的是产品内逐工具审批。这是两条不同取舍，不是成熟度高低的单一排序。[^warp]

## 7. 云与本地执行：能力不对称是明写的

`cloudSubagentRunner.js` 里，云环境明确抛错拒绝两类请求：`forkAgentId`/`resume="self"` 与 `continuationConfig`。云 resume 走的是提交 followup 消息再 `requestReconnect`，而不是本地那种直接续跑句柄。云会话记录 `parentConversationId` 与 `interruptedRunIds`，转后台时 `suppressTranscriptPath`。[^cloudrunner]

**同一产品内，本地与云的子 agent 能力不同，且在代码里显式拒绝而非静默降级。**这正是我们反复强调的原则：不要用一个"已支持"标记掩盖后端差异。新产品的引擎能力矩阵应当逐项声明 fork、continuation、resume、中断、审批，并在不支持时报错而不是假装成功。

执行隔离方面新增了 worktree 证据：worktree 根为 `.cursor/worktrees`，有专门的路径工具与 composer header；`best-of-n-runner` 类型的子 agent 在 prompt 前会被强制注入 worktree 命令说明，父会话的 git worktree 还会被子 agent 继承。[^sidechat][^composer]

## 8. Agent store：成员之间怎么交换产物

`agent_store` 是另一个新类别，解决的是多成员协作里"产物放哪"的问题。可见机制包括：按 `agentId` 与 mount（`self`/`peer`）探测 store 路径；scope 分 `agent` 与 `project`；不可用时返回带原因的结果（`not-provisioned`、`draft-agent`、`probe-failed`）；跨 agent 读 peer store 时校验相对路径，拒绝空段、`.` 与 `..`；另有冲突提示、技能同步设置与 store 迁移。[^storemount][^storeheader]

这比"把摘要写进共享 markdown"强：产物有归属 agent、有作用域、有不可用原因、有路径逃逸防护。新产品的 Artifact 层可以照这个形状设计，再补上版本与写入仲裁——后者依然没有证据。

## 9. 订阅与外部事件：有 scope 与过期，仍缺服务端保证

本轮能看到的比上一轮具体：订阅按 scope 分云（`bcId`）与本地（`conversationId`）两种键；客户端过滤 `expiresAtMs` 已过期项；只有存在订阅时才开启轮询；关闭订阅是乐观删除并在失败时回滚。转录行里有独立的 `subscriptionEvents` 类型，工作时长计算会用事件的 wake 时间切分，把等待外部事件的时间排除在工作时间之外。[^subscope][^subgroup]

另有一类"模拟用户消息"的来源枚举，把不同触发归一成带出处的消息：`SUBSCRIPTION`（Slack/GitHub/Origin）、`USER_QUICK_ACTION`、`MULTITASK`、`BABYSIT_PR_IN_CLOUD`、`CI_PANEL_INVESTIGATE_FAILURE`、`PR_TAB_BUGBOT_FIX`、`RUN_SECURITY_REVIEW`、各类 diff/PR 操作等，每项带标题、图标与链接。[^simulated]

**这是事件账本的一半。**来源、归属会话、展示元数据都有了；webhook 验签、事件去重、断线补投、顺序保持仍然没有证据，因为它们在服务端。新产品仍需自建来源事件 ID、消费确认与重试记录。

## 10. 与十二个对象的对比

先按"证据可见到哪一层"分类，避免把不同证据等级混排：

| 层 | 有可读实现的对象 | Cursor 本轮位置 |
|---|---|---|
| 产品会话与介入语义 | Cursor、Omnigent、Memoh、Cindy、AO | 从"有界面策略"升级为"有执行控制与审批模型" |
| 多成员任务组织 | Multica、Agent Swarm、AO、Cursor | 有成员协调与状态权威性，但缺服务端任务账本 |
| 原生引擎可替换 | Cindy、Omnigent、Multica、AO、Memoh、Warp 客户端 | **仍无证据**，只有自家 harness 与模型 gateway |
| ACP 生命周期 | Kandev、Omnigent、Memoh、Multica | **仍无证据**，只有一个 `agent_acp` 日志频道名 |
| 执行地点与隔离 | Kandev、Omnigent、Multica、Cursor | 有 worktree、云/本地分流、sandbox 读权限文件 |
| 服务端交付保证 | 无一个对象完整可见 | 不可见 |

再按机制逐项对比本轮新增的六个能力：

| 机制 | Cursor（本轮证据） | 最接近的其他对象 | 差异要点 |
|---|---|---|---|
| 委派幂等 | `toolCallId` 反查复用子 agent，重放不新建 | Multica 计划时点去重与租约 | Cursor 在会话工具层，Multica 在任务调度层；两者不互相替代 |
| 子 agent 嵌套 | 任意深度树，带防环与后代聚合 | Agent Swarm Lead/Worker、Multica Squad | Warp 明确限制一层；深度自由的代价是状态聚合复杂度 |
| 追加消息 | queue/steer/stop-and-send 三态，排队项合并，完成延迟上报 | Memoh 消息提交、Multica 领取重试 | Cursor 明确处理"完成撞上排队"，这一点其他对象未见等价实现 |
| 中断语义 | 树级中断 + 完成通知抑制 + run key 防串 | Agent Swarm 任务取消、Omnigent 会话中断 | Cursor 的抑制条件最细，但只覆盖客户端可见运行 |
| 逐工具审批 | 终端/MCP/编辑/计划/WebFetch 分型 review + 三层权限文件 | Memoh、Omnigent 权限桥 | Cursor 的工具分型与配置分层更完整；服务端强制性未知 |
| 状态不确定 | authoritative / fresh / unresolved 三级 | Cursor Projects 上一轮的 `isAuthoritativeMember` | 其他对象多为二值状态，这是 Cursor 相对独特的做法 |

**对"Cursor 是好对标"这个判断的修正**：它现在不只是产品形态对标，在委派幂等、追加消息语义、中断抑制和状态不确定建模这四项上，它是本仓库十二个对象里实现最细的客户端参考。但作为底座候选的结论没有变化——没有可替换引擎，没有 ACP，没有服务端。

## 11. 可以直接搬的与必须自建的

可以按这个形状直接实现，风险低、收益明确：

1. 委派用调用方的 `toolCallId`（或等价请求 ID）作幂等键，反查已有执行体再决定复用还是新建。
2. 执行体记录 parent 归属并在 resume/中断时校验，不匹配即报错。
3. 被取代的执行体 ID 进 superseded 列表，历史不随 ID 变化丢失。
4. 追加消息按 queue/steer/stop-and-send 三态解析，排队项合并，`requested_behavior` 与 `resolved_behavior` 分开记录。
5. 运行结束遇到排队项时延迟上报完成。
6. 每次运行有 run key，用户中断后抑制该 run 的失败通知。
7. 成员状态支持 authoritative/fresh/unresolved，并记录判断来源。
8. 子上下文继承历史但切断指令继承，同时在工具层做真实限制而不只靠提示词。
9. 引擎能力矩阵逐项声明，不支持的组合显式报错。
10. 产物有归属、作用域、不可用原因与路径逃逸校验。

必须自建、恢复集给不了答案的：

- 服务端任务账本与 exactly-once 语义（外部动作成功但回传丢失的情形）。
- webhook 验签、事件去重、断线补投与顺序保持。
- 共享上下文的版本、写入仲裁与冲突解决。
- 审批等待超时、客户端掉线时的许可状态。
- 任意原生 coding agent 的接入与原生会话恢复——这一层 Cursor 没有可借鉴实现，应回到 Kandev（ACP load/replay）、Omnigent/Memoh（权限与切换）、Multica（多 CLI 适配差异）。

## 12. 下一轮验证清单

| 待验证 | 需要看到的证据 |
|---|---|
| 幂等重放真实行为 | 同一 `toolCallId` 重放两次，是否只有一个子 agent 推进 |
| 排队合并与完成竞争 | 子 agent 即将完成时追加消息，父级看到的顺序与状态 |
| 中断树 | 多层嵌套下中断祖先，后代进程与通知的实际结果 |
| 云本地差异 | 云子 agent 拒绝 fork/continuation 时产品如何呈现降级 |
| 审批强制性 | 云执行下 allowlist 与 approvalMode 是否被服务端强制 |
| side chat 边界 | 用户在边界后要求修改文件，与工具层限制是否一致 |
| agent store | 两个成员并发写同一 store 路径的结果 |
| 订阅补投 | 客户端离线期间的事件在重连后是否补齐且不重复 |

本轮完成：核对 1047 个恢复单元哈希、按类别精读 coordinator/agent_store/side_chats/cloud_local_agents/shared_context/subscriptions 的关键模块、复核权限与审批的完整 schema、运行恢复测试（3/5 通过，2 个因缺原始 DMG 失败）。没有启动 Cursor、没有调用其云服务、没有验证任何服务端行为。

## 13. 固定证据

固定于研究仓提交 `bde2c651eb5cfbedb95b81cd18de8267885929d5`。

[^catalog]: 恢复目录与分类计数：[CATALOG.md](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/CATALOG.md)。

[^inventory]: 恢复清单：[inventory.json](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/inventory.json)。本轮重算全部 1047 个单元 SHA-256，无缺失与不匹配。

[^provenance]: 分发包身份：[provenance.json](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/provenance.json)、[PROVENANCE.md](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/PROVENANCE.md)。

[^test]: 恢复测试：[recovery.test.mjs](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/tests/recovery.test.mjs)，其中依赖 `DEFAULT_DMG_PATH` 的两个测试在本机无法运行。

[^executor]: 子 agent 执行控制：[subagentExecutor.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/subagentExecutor.js)，含幂等重放、前后台移交、并发上限与中断抑制。

[^composer]: 会话级编排：[subagentComposerService.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/subagentComposerService.js)，含归属校验、superseded ID、排队合并与延迟完成。

[^topology]: 托盘拓扑与状态分级：[subagent-tray.topology.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/subagent-tray.topology.js)。

[^membership]: 成员协调：[projectWorkerMembership.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/projectWorkerMembership.js)。

[^cloudrunner]: 云子 agent：[cloudSubagentRunner.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/cloudSubagentRunner.js)，明确拒绝 fork 与 continuation。

[^sidechat]: side chat 边界、确定性 ID、会话状态字段、worktree 常量：[Side-chat-boundary..slice.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/side_chats/out__vs__workbench__workbench.glass.main.js/Side-chat-boundary..slice.js)、[side-chats.ts](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/side_chats/out__vs__workbench__workbench.glass.main.js/side-chats.ts)、[Cannot-create-a-side-chat-inside-a-side-chat.slice.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/side_chats/out__vs__workbench__workbench.glass.main.js/Cannot-create-a-side-chat-inside-a-side-chat.slice.js)。

[^approval]: 人工审批契约：[pendingSubagentApproval.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/pendingSubagentApproval.js)。

[^allowlist]: 权限文件加载：[composerEffectiveAllowlistService.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/shared_context/out__vs__workbench__workbench.glass.main.js/composerEffectiveAllowlistService.js)。

[^permschema]: 权限模型（完整副本）：[permissions.schema.json](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/shared_context/extensions__cursor-always-local__schemas__permissions.schema.json/permissions.schema.json)。

[^storemount]: agent store 挂载与探测：[agentStoreSubagentMount.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/agent_store/out__vs__workbench__workbench.glass.main.js/agentStoreSubagentMount.js)、[agentStoreScopePaths.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/agent_store/out__vs__workbench__workbench.glass.main.js/agentStoreScopePaths.js)。

[^storeheader]: peer store 路径解析与校验：[projectAgentHeader.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/projectAgentHeader.js)。

[^subscope]: 订阅 scope、过期与关闭：[event-subscriptions-scope.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/event-subscriptions-scope.js)。

[^subgroup]: 订阅事件分组与 wake 时间：[subscription-event-grouping.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/subscription-event-grouping.js)。

[^simulated]: 模拟用户消息来源枚举：[isProjectCoordinator.slice.js](https://github.com/mikezhouhan/agent-fleet/blob/bde2c651eb5cfbedb95b81cd18de8267885929d5/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/isProjectCoordinator.slice.js)。

[^warp]: Warp 的一层限制与无人值守权限旁路见 [Warp 专题](warp-factories-analysis.zh-CN.md) 第 5、6 节及其固定证据。
