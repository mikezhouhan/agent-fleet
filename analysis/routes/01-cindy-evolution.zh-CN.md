# 基于 Cindy 演进多 Coding Agent 伙伴产品

## 结论

这条路线最适合以个人电脑为起点，尽早提供长期伙伴、原生 coding agent、工具和多会话协作的完整体验。它不是从空白接入几个 CLI，而是在已有的伙伴、会话、模型来源、权限和协作体系上演进。最大的优势是产品能力已经相交，最大的代价是继承 Desktop 主进程装配和各类历史兼容。

建议采用“保留原生适配、明确产品身份、加固协作控制、逐步分离后台服务”的顺序。若一开始强制把 Claude SDK、Codex app-server、Pi RPC 全部改成 ACP，再重写产品界面，会同时失去成熟适配与现有交互的复用优势。

需要先验证的决定性问题是：不依赖未公开服务端，能否跑通目标所需的本地账号、工具、伙伴和两个原生引擎；以及长期运行是否能逐步从 Electron 主进程解耦。它们决定这条路线是产品增量，还是披着 fork 外衣的大规模重建。

## 目标、假设与证据边界

目标是长期存在的伙伴，能以不同 coding agent 担任主管或 Worker，保留可见历史、允许用户介入，并让代码或其他产物可核验。假设首版本地优先，首批支持两个原生引擎，第三个用于检验扩展性；服务器常驻与跨主机编排是后续阶段。这些是用于比较路线的分析假设，不是已确认需求。

现状证据固定于 Cindy `f4422f816ccb`，补充参照 AO `ab968d5e7614` 和 Kandev `753e5549ee73`。以下“现状”是源码或权威文档事实，“建议”“阶段”是拟议演进。未执行构建、真实模型调用和故障测试，不对成功率、耗时或成本作实测承诺。

## 当前可以继承什么

Cindy 公开仓包含 Electron Desktop、Expo Mobile 及共享包，服务端位于独立仓库。不能把本仓的可用能力外推为完整官方服务均可自托管。[^1]

`maker-core` 的 Session 包装 BaseAgent，统一事件订阅、能力和交互回应；它自身不持有 LLM client。实际引擎是 Claude Agent SDK、Codex 原生 app-server、Pi 原生 RPC。这个边界允许产品使用统一会话，同时保留原生执行循环。[^2]

| 领域 | 已有起点 | 继承时需要确认 |
|---|---|---|
| 引擎接入 | Claude、Codex、Pi 分别适配 | 所选版本的真实能力及分发依赖 |
| 能力展示 | 支持/不支持及原因，区分 fork、rewind、steer 等 | UI 与真实会话能力是否始终一致 |
| 产品伙伴 | 永久 Profile、长期时间线、可重建执行上下文 | 本地功能对官方服务的实际依赖 |
| 多 agent | Orca Lead 与完整 Worker session | 工作区共享、归属与跨引擎限制 |
| 引擎交接 | 意图延迟应用、停泊会话、完整/增量交接 | 崩溃边界是否有足够持久证据 |
| 远端 | SSH、device-link 等已有路径 | 本路线选择支持哪些模式，避免同时承诺所有组合 |

Capabilities 中将同 turn 插话与 abort 分开，还区分 SDK 缺失、未实现、平台限制。这值得保留，不宜退化为几项布尔值。[^3]

Orca 文档描述三种 harness 可担任 Lead/Worker，MCP 与 IPC 复用服务；同时明确单 Lead team、Worker 共享 Lead 目录的默认语义以及部分未完成的工作流能力。当前跨引擎切换实现又明确拒绝远程与 Orca 会话，不能通过删除两个 guard 就认为这些场景已被支持。[^4][^5]

## 产品定位与目标形态

最自然的首个产品形态是“本机上的长期工程伙伴”。用户面对伙伴主时间线，具体开发任务派给独立 Worker；需要时展开 Worker 历史、diff、终端和权限请求。伙伴完成一次任务后仍保留身份和知识，Worker 是否存活则可以按资源情况决定。

在这条路线里，不宜一开始将所有普通 Cindy 任务都改造成 Bot。先增加清楚的绑定：伙伴拥有主时间线，任务拥有目标，execution 指向特定原生会话。保留既有非伙伴任务，避免迁移时猜测某条历史是否应被永久记忆。

主管不必永远使用一种引擎。创建团队时选择哪个 harness 担任主管，是先于“运行中任意切主管”的能力；前者容易界定，后者涉及团队所有权迁移，应该后置。

## ACP 与 agentctl 的位置

推荐保留当前三条原生接入，在同一能力契约下增加 ACP 适配作为新的实现。这样可以比较同一引擎经原生路径和 ACP 路径时的差异，再决定是否统一。上层角色和任务不依赖传输协议。

若业务明确要求全部 ACP，应把协议迁移作为单独阶段：对每种引擎列出审批、恢复、工具事件、图片、fork、模型控制和 steering 的差异，满足产品最低要求后再切换默认路径。已有原生 session 必须继续由原来的适配器管理，直到完成显式交接；不能把同一个 session ID 直接交给另一种 bridge。

agentctl 式服务解决的是执行地点与进程所有权，不是 ACP 解析。最初可在当前宿主内把职责收敛为一个模块；在需要关闭窗口仍工作或跨主机执行时，再提取为独立执行服务。不要同时保留旧 Maker 与新服务都能启动同一任务的双控制路径。

## 分阶段演进

### 阶段 0：建立可复用基线

先固定依赖与引擎版本，梳理账号、插件、模型目录、更新、同步、device-link 的外部依赖。对每项划分本地可用、可替换、当前依赖独立服务三类，实际验证核心路径，而不是只搜索配置字段。

产品结果应是一个可重复启动的本地实例，两个引擎各完成真实任务并留下正确历史。此阶段不重构布局、不增加新协议，不接入所有服务。退出条件是能说明核心执行路径用了哪些进程、存了哪些状态、调用了哪些外部服务。

### 阶段 1：明确伙伴与执行身份

保留伙伴主时间线与现有原生 session 绑定，在产品层明确“这次工作由哪个引擎执行”。新增身份只承载现有字段无法表达的关系，避免创建第二套几乎相同的 Session。

每个 execution 保存原生会话标识、账号/配置根的非敏感引用、工作区引用和运行代次；身份与密钥分开。界面默认展示伙伴和成果，调试详情才显示引擎绑定。退出条件是原生会话重建后，伙伴历史与产物关联保持不变。

### 阶段 2：加固已有混合团队

复用 Orca 的创建、派发、回传服务，先让两种引擎组成团队，确保 UI 操作与 MCP 操作走同一命令处理入口。保留 Worker 完整历史和用户接管入口，不把 Worker 降级为返回文本的函数调用。

对编码任务显式选择共享目录或独立 worktree。共享目录适合有序协作，独立 worktree 适合并行写入；不把 prompt 中的文件分工当作互斥锁。退出条件是一名主管、两名不同引擎 Worker 可独立完成、回报和被用户中断，结果有明确归属。

### 阶段 3：使交接成为可恢复过程

现有实现先登记意图，发送时关闭旧 live session、提交数据库、持久交接边界并建立新 session；切回时优先恢复停泊会话。源码还明确指出某些提交后的边界写失败会依赖进程内 pending 降级，因此需要围绕进程崩溃检查整条链，而非只检查正常路径。[^5]

建议将“切换意图—交接材料已持久化—源已停止—目标已确认—目标激活”的事实绑定到运行代次，并复用现有存储做原子化或可补偿处理。先支持普通本地任务，再选择一个 Orca Worker 做扩展试点；远程、主管切换分别后置。

交接保留近期对话、任务状态、文件与验证证据，以及按需检索旧历史的方法。现有 full/delta 和停泊机制可继续使用，不搬运原生隐藏状态。退出条件是每个切换边界强制退出后，都能明确恢复源、继续目标或进入可解释的待恢复状态，不出现双写。

### 阶段 4：加入 ACP，并验证原生能力不退化

新增一个 ACP 支持较明确的引擎，复用 Session、事件、交互和 Worker 服务。第一批 conformance 测试需覆盖真实消息顺序、权限回应、取消、断线、恢复和能力变化。

新驱动应声明实际支持能力；无法做到原生 fork 时只能提供明确标注的文本交接。若 ACP 的价值主要是扩大引擎覆盖，就保留混合协议；若收益足以覆盖差异成本，再有计划迁移。退出条件是 UI 不需要按每个 ACP 引擎增加特殊控制分支，差异收敛在 adapter。

### 阶段 5：分离常驻宿主与远端执行

先把本机执行所有权交给后台服务，让窗口关闭不终止工作，确认升级与重连行为；再扩展一个远端环境。通信需要任务级身份、能力握手和 artifact 地址，不能默认本地文件路径在远端也存在。

device-link 或 SSH 已有路径应选一条作为演进主线，避免同时建设第三套远端协议。退出条件是 UI 重启期间 Worker 仍可运行、重连可找回审批与状态，旧实例不能继续控制已被新实例接管的任务。

## 核心数据与上下文演进

优先扩展既有 session/worker/边界记录，不直接重写历史。新增稳定关系包括伙伴到主时间线、任务到多个 execution、execution 到 native session、交接到源/目标运行代次。结构化产物记录应能引用文件、diff、命令结果或外部对象，而不只保存一句“已完成”。

长期记忆只保存明确稳定的偏好和事实，任务临时策略留在任务上下文。原生引擎自动记忆与产品共享记忆可能重复，必须定义谁拥有哪类信息；暂停某种自动记忆不等于删除历史。

凭证切换还必须区分模型来源与历史存放位置：旧 session 的历史可能位于旧配置根，但新请求应使用当前授权来源。不能为了读历史就恢复旧账号，也不能把账号路径泄漏进用户可见回传材料。

## 模块级改造地图

| 模块 | 建议动作 | 主要风险 |
|---|---|---|
| maker-core Session/BaseAgent | 保留契约，新增 ACP 实现与明确 capability | 为统一而丢失原生能力 |
| 各引擎 translator | 保留并增加版本回归素材 | 上游事件变更导致错误归因 |
| maker-ipc Orca 服务 | 复用服务，收敛所有入口 | IPC/MCP 的权限与幂等不一致 |
| sessionAgentSwitch / agentHandoff | 保留 full/delta，补持久切换证据 | 原子边界、停泊 session 失效 |
| localDb 与存储接口 | 增量记录 execution/产物/交接事实 | 历史迁移与双重真相源 |
| Desktop main / maker-host | 先收敛职责，再提取后台服务 | 生命周期与身份上下文遗漏 |
| renderer / Mobile | 保留现有状态投影，渐进呈现伙伴与成果 | 只改桌面导致远端镜像语义不同 |

仓库的架构约束要求共享 package 通过注入与 Desktop 解耦；这是提取的方向，但不代表当前所有装配都已可独立运行。[^6]

## 风险、成本与停止条件

| 风险 | 预警信号 | 控制方法 |
|---|---|---|
| fork 维护成本失控 | 每次上游同步都影响账号、Session、事件 | 保留修改层级清单，小步同步，兼容测试先行 |
| ACP 迁移反而退化 | 原生能力大量变为不可用 | 单独比较两条路径，不为统一强制切换 |
| 依赖未公开服务 | 本地核心路径无法独立认证或执行 | 在阶段 0 暴露，先替换必要依赖再投资 UI |
| 后台服务提取过早 | 同时重写 IPC、数据库、工具、启动 | 先统一职责，后改变进程边界 |
| 协作切换失去归属 | 回传到旧主管、旧 Worker 继续写 | generation、持久交接、单一执行所有者 |

相对投入：本地演示较低，完整独立产品为中高，协作切换与后台提取为高。这里不提供未经验证的周数；基线跑通后才能按模块依赖闭包估工。适合同时具备 Electron/TypeScript 产品经验与原生 agent 协议经验的团队，不能只配置 UI 人员。

若发现核心能力广泛依赖不可获得服务，或分离执行宿主必须重写多数主进程装配，应停止扩大 fork 范围，重新评估独立核心或 AO 路线。若多 ACP 引擎成为硬需求，而原生路径不断成为阻碍，也应重新计算继续保留 Cindy 底座的收益。

## 验证与迁移策略

建议把下列场景作为未来验收，不把当前测试存在当作已验证结果：

| 场景 | 通过标准 |
|---|---|
| 两种引擎普通任务往返切换 | 一个产品任务，交接可见且无重复执行 |
| Worker 审批时应用重启 | 审批仍归属于原任务和正确运行代次 |
| 协作回传重复投递 | 父任务只接受一次结果，原始记录仍可追溯 |
| 停泊 native session 消失 | 明确交接重建，不伪装原生 resume |
| 旧进程延迟返回事件 | 不覆盖新执行状态，不消费新审批 |
| 账号切换后读取旧历史 | 请求与历史身份边界符合当前选择 |
| 原生和 ACP 路径对比 | 必需能力无隐形降级，差异可观察 |

迁移应按新任务选择新路径，旧任务继续使用其原执行绑定。数据库变更先新增、验证，再切读写；涉及新格式写入后，旧二进制是否可读必须单独确认。回滚应暂停新执行、保留历史和工作区，通过旧路径恢复可证明兼容的任务，而不是回退数据库文件。

## 路线裁决

选择这条路线的理由，应是现有伙伴和原生接入能显著缩短到真实可用产品的距离。它的长期演进方向是把已存在的能力变得边界清晰、可常驻、可扩展，而不是换掉所有底层后只保留一个界面。

最先值得实施前验证的三个实验是：脱离官方服务的核心链路、混合 Worker 的工作区与回传、跨引擎切换中的崩溃恢复。三者通过，再决定 ACP 扩展和后台服务提取。

## 来源

以下来源均为本地源码快照；Cindy 提交 `f4422f816ccb`。引用的上游功能不代表最新发布版本已实机验证。

[^1]: MakeCindy， [README](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/README.md) 与 [仓库规则](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/AGENTS.md)，客户端与独立服务端边界。
[^2]: MakeCindy， [Session](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/session.ts#L1)、[Agent 导出](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/agents/index.ts)、[Codex transport](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/agents/codex/app-server/stdioTransport.ts#L66)、[Pi RPC](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/agents/pi/rpc-client.ts#L1)。
[^3]: MakeCindy， [Capabilities](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/types/capabilities.ts#L10)，能力与不支持原因。
[^4]: MakeCindy， [Orca 协作架构](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/docs/dev-rules/orca-team-architecture.md)、[伙伴运行时](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/docs/product-rules/cindy-bots-runtime.md)。
[^5]: MakeCindy， [引擎切换实现](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/sessionAgentSwitchHandler.ts#L1)、[场景限制](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/sessionAgentSwitchHandler.ts#L420)、[交接构造](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/agentHandoff.ts)、[回归测试](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/__tests__/sessionAgentSwitchHandler.test.ts#L170)。
[^6]: MakeCindy， [架构不变量](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/docs/dev-rules/architecture-invariants.md)，package 与主进程边界。
