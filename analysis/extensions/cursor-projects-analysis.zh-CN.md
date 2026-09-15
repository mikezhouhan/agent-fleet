# Cursor Projects：产品编排机制、源码证据与复用边界

## 1. 结论与研究范围

Cursor Projects 对多 coding agent 产品最有价值的启发，是把项目做成持续组织工作的入口：项目成员、主管和 Worker、工作成果、用户插话、上下文以及外部事件共同构成工作过程。它补充了 Grok 的伙伴体验，也给 AO、Cindy 和 Omnigent 这类会话系统提供了更完整的项目组织视角。

**它目前适合作为产品与协议行为参考，不能作为一个已验证可运行、支持替换 coding agent 的开源底座。**本次对象是仓库内的 `cursor-projects-reversed/`，来自 Cursor 3.20.17 macOS arm64 分发包的客户端恢复材料；没有云端 coordinator、执行 VM、共享存储和 webhook 服务源码。[^1]

分析使用的研究仓提交为 `06c9086284257611dd95d3367ee74e0cfafb05eb`。安装包 SHA-256 为 `a3cf86050ea4c322b8a63fa840f35a54318c46da9b33281c2b223a17e473c738`；客户端记录的 product commit 为 `0c32194e3fb5ffaced9fb36430b860ec301e1fc0`。这里的“存在”指静态分发代码中的证据，不能推导为某账号已开放功能或端到端运行成功。

## 2. 先校准恢复材料的可靠性

本轮核对了 inventory 中全部 70 个单元的内容哈希，全部与清单一致。其中 6 个为完整 JSON 副本，13 个为 marker window，51 个为 named-module slice。64 个 JavaScript 单元均标记 `beautified: false`。这证明材料可追溯，没有证明它们是完整模块。[^2]

提取器从 `O({"某模块.js"()` 的位置开始，截取到下一个 `O({"`；它没有用 AST 恢复整个模块的依赖和导出。在该打包形态中，相关函数可能在初始化标记之前，而标记之后可能已经进入下一个模块的函数。因此，`truncated: false` 只代表未触及人为长度上限，不表示语义完整。[^3]

实际例子是 `projectContextContent.js`：切片里的主要函数展示 Gallery/List 布局；回看同哈希的本地完整 payload，可以在模块标记前看到 markdown/plan/mermaid 内容读取函数。`localSubscriptions.js` 切片包含服务标识，但不能据此认定订阅持久队列和投递去重完整恢复。已有安全观察是线索，本报告对关键判断回到实际代码核实。[^3][^4]

| 证据级别 | 可以得出的结论 | 不能得出的结论 |
|---|---|---|
| 完整 schema / package manifest | 有该配置字段、扩展入口和声明 | 配置已被云服务强制执行 |
| 包含完整局部逻辑的切片 | 局部算法、分支和状态处理存在 | 全部调用方、持久事务、端到端行为已确认 |
| proto / 服务标识 / UI 文案 | 产品定义了该概念或通信字段 | 对应后端已实现、已开放或已经可靠运行 |
| 本地完整 payload 邻域 | 校对切片前后关系与函数位置 | 恢复到原始 TypeScript 与云端实现 |

对于新产品设计，应优先借鉴能够解释具体问题的局部机制，而不是复制被模块名包装的代码片段。

## 3. 项目模型：把会话归属变成明确状态

`agentProjectService.js` 维护本地与云项目的独立列表和 membership storage keys，再通过 facade 合并。项目记录有身份、名称、workspace、创建/更新时间和归档状态；membership 是单独的映射。它还按 workspace canonical key 去重，并在项目记录合并时重写归属。[^5]

这解决的不是模型推理问题，而是用户长期使用后的信息一致性问题：同一工作区被重复注册、已有会话换了标识、项目归档但历史还需检索、本地与云项目要出现在同一入口。新产品的 `Project`、`Session`、`Workspace` 不宜混成一个对象。

对比 Cindy，Cursor 这部分更突出“项目如何组织许多会话”；Cindy 更突出永久伙伴与主时间线。对比 Omnigent，后者已有独立 Project 表，但它的 config 是新建会话时的默认提示，而非持续约束。新产品可以结合两者：伙伴维持关系，项目保留目标和成果，会话只是执行载体。这里是设计建议，不能说 Cursor 已实现这套跨引擎模型。

## 4. Worker 成员协调比多开窗口更重要

`projectWorkerMembership.js` 是当前切片中较强的实现证据：它区分 pending/resolved、server worker IDs、optimistic additions 和 placement，并维护请求失效、scope、重试和 hydration 状态。[^6]

其中有几个值得直接写入产品验收条件的行为：

- 列表请求返回后检查请求是否已失效、当前 scope 是否仍一致，避免旧账号或旧项目响应污染当前视图。
- 同一项目刷新在途时合并后续刷新，跨项目请求受 semaphore 限制；错误进入退避而不是持续重试。
- 对服务端不完整快照，缺失一个 Worker 不等于它已被删除。`isAuthoritativeMember` 在无法确认时保留未知状态。
- 客户端乐观新增与服务端权威成员分开处理，Worker 详细状态按需要加载。

这对多引擎系统同样重要。一个 ACP 连接断开、一次列表分页遗漏或一个云主机暂时离线，都不能直接变成“Worker 已结束”。这些机制是 UI/客户端协调证据，不能升级为“整个 Cursor 编排系统提供强一致事务”。

`coordinator_tools_pb.js` 和相关恢复窗口提供主管/Worker 工具概念；但 coordinator 的实际规划循环和执行权限不在该恢复集里。因此，“主管只计划、不写代码”只能作为拟议产品职责，不能当作已验证的服务端限制。[^7]

## 5. 人类介入：queue、steer、stop-and-send 必须分开

`projectFollowupSteeringPolicy.js` 中可直接看到跟进消息行为解析：结合主要/替代操作、steering 是否可用、模拟提交、是否必须保留队列等条件，在 queue、steer 和 stop-and-send 之间选择。[^8]

这比界面统一放一个发送按钮更有价值。用户可能希望补充约束而不打断当前步骤，也可能必须立即停止一个错误方向。若目标 agent 不支持 turn 内 steer，产品必须表现出真实降级，例如排队或先停再发，而不能把普通追加消息标成“已插话”。

ACP adapter 能否发送消息只是底层条件；调度层还必须知道消息意图和本次提交采用的行为。建议把 `requested_behavior`、`resolved_behavior`、`accepted_at`、`consumed_at` 独立记录，使重连后的 UI 不会把“服务端接收了消息”误显示为“agent 已经采纳”。

## 6. 执行地点与权限分层

分发包中的扩展 manifest 分别声明了本机 agent 工具执行、agent host，以及 workspace extension host 之外的 local agent runtime。项目环境 schema 包含安装/启动脚本、仓库依赖、网络访问模式等配置；permissions schema 则声明 approval mode 和 allowlists。[^9]

它展示了一种分层方向：产品窗口、会话控制、执行宿主、工作环境和工具权限不是同一层。这个方向与 Kandev 的 agentctl、Omnigent 的 host/runner/harness 有可比性，但不能据此判断三者具备相同隔离强度。

本地 gateway 配置还暴露了兼容模型 API 的 base URL 和 API key 入口。**接入不同模型服务不等于接入不同 coding agent。**当前恢复材料没有提供一套可验证的通用 ACP client 加可替换原生会话 registry；也不能用“未恢复到”断言整个 Cursor 产品完全没有 ACP。[^10]

对新产品而言，`RuntimeDriver` 管原生会话语义，`ExecutionHost` 管执行地点，`Policy` 管允许的行为；三者分别选择与验证。把模型 gateway 当作 runtime 插拔点，会重新回到只有一套自有 loop 的状态。

## 7. 上下文与订阅：有产品结构，仍缺运行闭环

恢复材料包含项目 notes/document 展示、PR shared context、transcript 路径与云 transcript 索引线索。其价值在于把任务所需材料提升为项目资源，而不要求每次对话重新粘贴。但共享内容的版本、同步冲突、服务端访问控制和写入仲裁没有足够材料验证。[^4][^11]

subscriptions 中可见 Slack/GitHub/Linear/Origin 来源枚举、连接入口和调度展示，本地 mailbox 有服务标识。不能因为存在这些名称，就宣称 webhook 验签、事件去重、断线补投、顺序保持和完整调度器已经还原。[^12]

如果要借鉴该体验，应建设自己的事件账本：来源 event ID、项目归属、目标会话、处理状态、消费确认和重试记录。上下文则使用有版本的 Artifact/Decision 记录，避免多 agent 同时覆盖一份共享摘要。这个工作在八个比较对象中都要逐项查验，不能由“支持 MCP”或“支持订阅”自动补齐。

## 8. 优缺点与其他七个对象的关系

| 对象 | Cursor Projects 增加的视角 | 仍应从该对象学习的能力 |
|---|---|---|
| Grok 重建版 | 项目级组织、Worker 归属、工程成果 | 长期伙伴与连续消息体验 |
| Cindy | 项目成员协调、云/本地统一入口 | 多原生引擎接入、停泊会话与交接 |
| Rakazo | 项目目标和工程上下文聚合 | Bot/Computer/Routine、自托管产品栈 |
| AO | 更完整的项目交互与工作呈现 | 原生会话监督、恢复、工程交付控制 |
| Kandev | 主管与项目成员体验参考 | ACP 会话加载和 agentctl 执行环境 |
| DSH | 项目组织和人类介入的产品需求 | 插件能力组合与内部运行时契约 |
| Omnigent | 超越会话分组的项目工作模型 | 可运行的 meta-harness、策略和多端控制面 |

主要优点是项目层概念丰富，且成员刷新与消息提交中已有具体的复杂状态处理。主要缺点不是功能少，而是研究可见性与复用方式受限：客户端耦合 VS Code/Electron 体系，云端闭环缺失，恢复切片不构成可维护的原始代码库，也没有可验证的异构执行引擎替换能力。

## 9. 借鉴路线与退出条件

建议采用“独立实现产品模式”，并把 Cursor 作为验收场景来源：

1. 建立 Project、CoordinatorSession、WorkerMembership、Artifact 四类明确对象；先让用户人工创建和归属 Worker，验证产品组织是否有价值。
2. 接入两个不同原生引擎，按真实能力实现 queue/steer/stop-and-send；测试延迟响应、断线、重连和用户切换项目。
3. 增加主管委派与成果验收，保留实际执行者和证据；Worker 完成不直接等于项目目标完成。
4. 增加项目上下文版本和订阅事件账本，验证重复事件只产生一次工作，以及上下文冲突可追溯。
5. 需要远端时再引入云 host，把产品对象与执行地点分离。

若必须依赖尚未公开的 Cursor 云 API 才能交付核心流程，应停止把它作为实施底座；若为了外观复刻而需要持续修补 minified bundle，也应回到独立产品实现。这不是对 Cursor 成品质量的否定，而是当前材料到新产品之间的工程距离判断。

## 10. 验证与未决事项

本轮完成恢复单元与本地完整主 bundle 的哈希核对，并执行恢复目录现有测试，4/4 通过；具体范围见[综合报告验证表](eight-project-comparison.zh-CN.md#9-本轮验证记录)。没有启动 Cursor、重签应用、调用其云 agent，也没有声称确认云端安全控制。

下一轮最有价值的实机问题是：Project 与普通会话的边界如何呈现；主管和 Worker 中断如何联动；云/本地 Worker 断线后的状态如何变化；订阅积压是否合并；项目上下文由谁写入。需要实际产品访问和可控测试环境，不能从这个切片集合继续推导答案。

## 来源

[^1]: Cursor 分发包身份与恢复范围：[PROVENANCE.md](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/PROVENANCE.md)、[NOTICE.md](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/NOTICE.md)。

[^2]: 恢复清单：[inventory.json](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/inventory.json)。本轮逐项核对 70 个恢复文件 SHA-256。

[^3]: 提取器：[extract.mjs](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/scripts/lib/extract.mjs) 中 `extractNamedModuleSlice`、`extractMarkerWindow`、`beautifyJs`；切片邻域另以本地 `work/payload/out/vs/workbench/workbench.glass.main.js` 核对，原包身份见 [^1]，该完整 payload 未发布。

[^4]: 上下文切片：[projectContextContent.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/shared_context/out__vs__workbench__workbench.glass.main.js/projectContextContent.js)、[project-notes-document.react.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/shared_context/out__vs__workbench__workbench.glass.main.js/project-notes-document.react.js)。

[^5]: 项目注册与归属：[agentProjectService.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/agentProjectService.js)。

[^6]: 成员刷新与协调：[projectWorkerMembership.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/projectWorkerMembership.js)。

[^7]: 主管工具定义与本机标记：[coordinator_tools_pb.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/coordinator_tools_pb.js)、[CursorProject.slice.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/coordinator/extensions__cursor-agent-host__dist__agent-host-daemon__dist__bin__daemon.cjs/CursorProject.slice.js)。

[^8]: 跟进消息策略：[projectFollowupSteeringPolicy.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/coordinator/out__vs__workbench__workbench.glass.main.js/projectFollowupSteeringPolicy.js)。

[^9]: 执行入口：[cursor-agent-exec package](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/cloud_local_agents/extensions__cursor-agent-exec__package.json/package.json)、[cursor-agent-host package](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/cloud_local_agents/extensions__cursor-agent-host__package.json/package.json)、[local runtime package](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/cloud_local_agents/extensions__cursor-local-agent-runtime__package.json/package.json)；[environment schema](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/cloud_local_agents/extensions__cursor-always-local__schemas__environment.schema.json/environment.schema.json)、[permissions schema](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/shared_context/extensions__cursor-always-local__schemas__permissions.schema.json/permissions.schema.json)。

[^10]: 模型 gateway 配置：[localAgentGatewayConfiguration.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/cloud_local_agents/out__vs__workbench__workbench.glass.main.js/localAgentGatewayConfiguration.js)。

[^11]: PR 上下文与 transcript：[pr_shared_context.slice.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/shared_context/out__vs__workbench__workbench.glass.main.js/pr_shared_context.slice.js)、[transcriptPaths.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/shared_context/out__vs__workbench__workbench.glass.main.js/transcriptPaths.js)。

[^12]: 订阅证据：[localSubscriptions.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/localSubscriptions.js)、[localSubscriptionMailbox.js](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/localSubscriptionMailbox.js)、[订阅来源枚举窗口](https://github.com/mikezhouhan/agent-fleet/blob/06c9086284257611dd95d3367ee74e0cfafb05eb/cursor-projects-reversed/recovered/subscriptions/out__vs__workbench__workbench.glass.main.js/SUBSCRIPTION_SOURCE_SLACK.slice.js)。
