# 基于 Agent Orchestrator 演进长期伙伴产品

## 结论

这条路线最适合以可靠的软件任务执行为切入口，把长期伙伴建立在已有的多 coding agent 监督系统上。AO 的价值不是 agent 图标多，而是区分原生会话、产品 session、终端与 Chat 控制器，并围绕恢复、交接、权限和交付状态建立持久事实。

建议保留 daemon、会话管理、ChatDriver、原生进程 host、worktree、PR/CI 和事件机制，在其上增加伙伴身份、跨任务知识、例行工作和通用工具。先把项目主管提升为可持续合作对象，再扩展到非代码场景。

若首要目标是邮箱、日历、共享桌面等通用数字同事，而编码只是偶尔出现，AO 可能需要补建太多产品能力。选择它应是因为“可靠执行与交付”足以支撑第一阶段产品价值。

## 目标与证据边界

目标是一个长期伙伴可以选择不同原生 harness 承担主管和 Worker，任务可恢复、用户可介入、产物可核验。比较假设首版本地 daemon 加桌面界面，优先 Git 项目，首批两个 Chat 驱动；通用电脑与跨主机属于后续扩展。

现状固定于 AO `ab968d5e7614`。关于部署、恢复和 Chat 的描述来自代码与架构文档；后续阶段均为分析建议。未运行真实 agent 或故障注入，因此不声称其现有恢复机制已经在目标环境证明可靠。

## 当前基础

AO 使用长期 Go daemon，UI 与 CLI 通过服务接口访问；SQLite 保存事实，数据库触发器 change log 经事件广播推送客户端。显示状态由活动、PR、CI 和 review 等事实派生，而非存一套独立看板状态。[^1]

TUI 与 Chat 是不同控制契约：终端启动、按键与字节流由 Agent/Runtime 负责，机器协议和类型化事件由 ChatDriver 负责。同一会话不能同时由两个活动控制器操作。[^2]

当前 Chat registry 注册 Codex、Claude Code、OpenCode、Droid、Kimi、Kimchi、Pi、Cursor、OMP。Codex 使用 app-server，其余这些 Chat 路径使用 ACP；README 所称 27 个 agent 不能解释成 27 套等深度 Chat 能力。实际可用还受安装、认证、版本和 probe 约束。[^3]

| 已有能力 | 对新产品的价值 | 不应外推的结论 |
|---|---|---|
| 项目主管 | 可从目标分解到 Worker 执行 | 不等于完整个人长期伙伴 |
| Native session 与恢复 | 任务不随窗口生命周期丢失 | 不等于任何 agent 都可恢复 |
| Chat/TUI 分离 | 不靠终端解析伪装结构化消息 | 不等于两种模式体验完全一致 |
| Worktree 与 PR | 代码成果有归属和交付上下文 | 不覆盖所有外部系统副作用 |
| 持久 agent switch | 源/目标执行权有明确过程 | 不代表内部上下文无损迁移 |
| 浏览器与预览 | 可支持开发验证 | 不等于完整通用 Computer 平台 |

## 目标产品层

建议新增 Bot Profile，包含稳定身份、责任范围、默认 harness 策略和记忆命名空间；Bot 关联一个或多个产品任务，不把 Bot 本身做成某个永不结束的 native session。

项目主管可以是伙伴的一个工作上下文。同一个伙伴跨项目时，应显式授予项目访问，不能默认把所有项目历史混进同一上下文。工程 Worker 仍保持自己的 branch/worktree/PR 归属。

界面从“选择 agent、创建 session”逐步转向“找伙伴、描述目标、看成果”。保留原生 Chat、终端、diff 和 CI 作为可展开的工作细节，避免为追求简洁删除原有诊断和介入能力。

## ACP 与执行服务策略

AO 已是混合协议。若没有明确的纯 ACP 约束，保留 Codex 原生 app-server，其他走 ACP，更能保存已有能力和投资。对所有驱动统一的是产品命令、事件、交互和 capability，不要求线缆协议相同。

若纯 ACP 是硬要求，应先在同一测试场景中比较 Codex 原生与 codex-acp：原生 thread 恢复、审批、工具输出、分叉、模型控制和上下文统计的差异。通过能力门槛后，新增任务才切默认，已有会话继续由旧 driver 服务或显式交接。把 bridge 当成透明替换会误判兼容成本。

AO 已有长期 daemon 与 detached provider host。首版不宜再并行引入一套 Kandev agentctl。跨主机时可提炼执行服务边界，先让现有 host 成为一种实现，再扩展远端；任务级生命周期仍由一个控制面拥有。

## 分阶段演进

### 阶段 0：选定可靠的 Chat 子集

只选择首批两个原生 agent，固定版本和认证方式，跑通多轮、审批、停止、重启恢复、文件修改和 PR 关联。把每项能力记录为实际验证、上游支持但未验证、缺失三种状态。

保留 TUI 给高级用户和诊断，但不要把 TUI-only agent 放进默认统一聊天体验。退出条件是所选 Chat 路径满足完整用户工作链，而非只通过一条问候消息。

### 阶段 1：在已有任务上增加伙伴身份

新增 Profile 与 session 绑定，主时间线展现伙伴收到的目标、委派、产物和需要用户处理的事项。既有项目 session 不改变历史归属，只在明确选择后关联某个伙伴。

记忆初期采用可读、可纠正的有限事实，明确项目级与伙伴级范围。伙伴删除不自动删除工作区、PR 或被共享的任务记录。退出条件是同一伙伴可跨多次任务继续工作，原生会话重建不影响身份和历史。

### 阶段 2：统一主管与 Worker 的产品语义

复用项目主管和 Worker 创建能力，但把任务目标、约束、交付物、依赖与验收结果显式记录。主管负责提出拆分和综合，控制面负责执行归属、权限、并发和持久投递。

不同 harness 可担任主管，无需固定一个自研 loop。第一阶段只支持创建时选择主管引擎；运行中切主管需要处理待回传 Worker 的接收者身份，不应与普通 Worker 切换一起默认开放。

退出条件是一个主管能管理两种不同 Worker，用户插话不会丢失，重复完成事件不会导致重复验收或另一次自动推进。

### 阶段 3：让交接服务于伙伴连续性

AO 的切换实现已有持久 saga、source/target generation、native session、交接材料和确认边界。应保留这一机制，并将伙伴任务信息作为确定性事实加入交接，而不是另造一套 Bot switching。[^4]

交接包含目标、最新用户约束、当前工作区、验证事实、未完成动作和结果引用。源 agent 的语义总结是辅助证据，不应覆盖真实文件和最新授权。原生 session 的 available/unavailable/unknown 三态要继续保留。[^5]

退出条件是普通 Worker 切换后工作归属与 PR 保持稳定；源停止无法确认时不启动可能并发写入的目标；目标启动失败有可解释的恢复路径。

### 阶段 4：增加例行任务与长期后台工作

建立面向伙伴的 schedule/routine，而不是简单定时启动 CLI。调度实例要有独立 occurrence 身份、计划时间、触发原因和可重试状态，并关联实际 execution。

既有项目自动化若能满足某类触发，可复用入口；但要核实其权限与幂等语义，不能把 CI 观察循环直接当通用日历调度器。关机错过的任务应有明确补跑或跳过策略；并发触发是否排队要可解释。

退出条件是重启不重复触发同一 occurrence，失败不会无休止唤醒主管，例行工作不会抢占用户正在进行的任务。

### 阶段 5：拓展共享工具与非代码工作

保留项目浏览器和终端能力，为伙伴增加通过 MCP 等方式访问的通用工具。账号、授权和工具执行地点独立于 agent 默认配置；工具结果形成 artifact 或引用。

Scratch 工作区可作为非 Git 任务的一种底层载体，但 Scratch 目录不等于完整 Computer。真正的共享桌面、登录态、文件同步和人类接管需要单独设计，不应复用 worktree 语义冒充。

退出条件是一个非代码任务也有清楚的成果、审批和恢复链，并且不会破坏现有代码交付路径。跨主机扩展应在本阶段后选择一个具体场景验证。

## 状态与事件演进

新增伙伴状态应派生自任务事实，如正在工作、等待用户、空闲；不要把看板状态复制成 Bot 表的第二套真相。伙伴可以同时有多个任务，“某个任务失败”不等于“伙伴整体失败”。

Native session、当前 execution 和产品 task 分别保存身份，迟到事件按运行代次归属。交互记录应保存原始可选项、当前有效状态与来源；两个客户端回答同一请求时，只允许一个有效决策被采纳。

产品历史是可供用户阅读的稳定记录，原生上下文仍归 driver。共享记忆、交接和搜索只提供明确的可见材料，不能承诺知道原生 agent 所有内部状态。

## 可靠性与用户介入

AO 的 ACP steering 明确请求 `promptRequired`：当原 turn 已结束，不能悄悄启动没有产品记录的新 turn。新产品需要保留这类精确语义，界面区分当前插话、排队、停止后发送。[^6]

Detached host 让 daemon/桌面替换后重连仍有机会保留运行中的工作。新增伙伴层必须适配这种事实：主窗口没有订阅不等于任务停止，浏览器刷新不应自动重发最后一条 prompt。[^1]

停止也分为停止当前 turn、取消排队任务、终止 session 与归档可见记录。将这些动作合成一个“关闭伙伴”按钮会破坏已有可靠性。简单 UI 可以把危险或罕见动作藏到详情里，但后台含义仍要分开。

## 模块改造地图

| 模块 | 处理方式 | 保留的关键约束 |
|---|---|---|
| domain/storage | 新增 Bot、routine 与任务关系 | 事实持久，显示状态派生 |
| session_manager/lifecycle | 复用现有命令和执行权 | 不另开 Bot 专属进程启动通道 |
| service/chat + ChatDriver | 保留，按能力扩展 | provider DTO 不泄漏到产品 UI |
| agent_switching | 增加伙伴上下文输入 | 单一切换 saga、代次与幂等 |
| SCM/workspace/review | 保留代码任务交付价值 | 非 Git 任务不伪造 PR 状态 |
| HTTP/事件/CLI | 通过现有服务暴露新对象 | API 契约与生成类型同步 |
| renderer | 新增伙伴主时间线和注意事项 | 保留可追溯的原生工作详情 |
| provider host | 首版保留，后续提炼远端接口 | 恢复未知不能等同死亡 |

## 成本与风险

相对投入：可靠编码 MVP 为低到中，伙伴化为中，通用 Computer 和应用生态为高。适合 Go 后端与 TypeScript 产品协同的团队；原生恢复与协议测试需要专门投入，不能因为底座已有代码就认为维护免费。

模型成本需要分开记录主管规划、Worker 执行、审查和交接。事件或 CI 每变化一次就让主管跑一轮，会产生无效成本；应聚合变化，仅在有待决策工作时唤醒。原生 usage 不可用时应标为未知，不能把缺失记作零。

| 风险 | 预警信号 | 处理原则 |
|---|---|---|
| 产品仍像终端管理器 | 伙伴只是 session 改名 | 增加长期身份、任务回顾、记忆和成果聚合 |
| 为纯 ACP 牺牲能力 | Codex 原生恢复或交互退化 | 新旧路径对照，未过门槛不切默认 |
| Bot 与 project 权限混合 | 跨项目记忆泄漏或误用工作区 | 明确 scope 与授权，显式关联项目 |
| 新调度绕过 session_manager | 定时任务自起进程，不写现有状态 | 所有入口复用命令与生命周期 |
| 上游同步频繁冲突 | 同时重写核心 session 与 UI | 尽量做新增领域与稳定接口上的扩展 |
| 通用工具范围失控 | 首版同时做邮件、手机、桌面和云 | 先验证一个非代码场景再扩大 |

若产品最重要的价值不在代码交付，且大部分工作都要绕过 project/worktree/PR 模型，AO 底座优势会下降；此时不应继续为保留它而制造虚假的工程任务概念。

## 验证、迁移与回退

先只为新建伙伴提供新界面，旧任务仍能在原生工作台中访问。Bot 绑定、routine 和记忆均采用新增数据，不自动把所有历史项目总结成共享记忆。现有 native session 与配置根保持原样。

| 验证场景 | 通过标准 |
|---|---|
| 两种 Chat 引擎完整任务 | 工具、审批、产物和终态有正确归属 |
| daemon 重启且 agent 正在运行 | 重连或明确未知，不重复发起任务 |
| 普通 Worker 跨 harness 切换 | worktree/PR/任务身份稳定，无双控制器 |
| 原 turn 与 steering 同时结束 | 输入被明确排队或拒绝，不产生幽灵 turn |
| 同伙伴两个项目同时工作 | 记忆、工具和成果不混淆 |
| 定时 occurrence 重试 | 只发生一次授权执行或明确未知 |
| 伙伴 UI 回退 | 原任务、执行状态和原生 Chat 仍可访问 |

升级回退不应删除新增事实，旧版本无法解释的任务应只读或交给兼容版本处理。原生进程和数据库格式分别有兼容边界，不能只回退 UI 就假设整个运行时已回退。

## 路线裁决

这条路线的价值是把已有可靠会话与软件交付能力转化为更容易长期合作的产品。首先验证“长期伙伴映射到已有 session 体系是否自然”，再扩展 routine 和非代码任务。

最先的三个试验应是伙伴主时间线绑定两个项目、混合 Chat Worker 与完整审批链、升级期间切换与恢复。它们决定 AO 能否成为产品核心，而不是最后只借到一个看板。

## 来源

以下均为 AO 本地快照 `ab968d5e7614`，不代表所有功能在任意 agent 版本上可用。

[^1]: Untrivial-ai/AO， [架构](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/docs/architecture.md)、[产品状态](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/docs/STATUS.md)，daemon、持久事实和 detached host。
[^2]: AO， [Chat port](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/ports/chat.go#L11)，TUI/Chat、恢复错误、交互与能力门槛。
[^3]: AO， [Chat driver registry](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/adapters/chatdriver/registry/registry.go#L66)、[README](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/README.md)。
[^4]: AO， [agent switch](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/session_manager/agent_switching.go)、[持久存储契约](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/ports/agent_switching.go#L15)。
[^5]: AO， [native session continuation](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/ports/agent_continuation.go#L59)，原生状态三态探测。
[^6]: AO， [ACP steering](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/adapters/chatdriver/acp/steer.go#L20)，同 turn 插话的确认语义。
