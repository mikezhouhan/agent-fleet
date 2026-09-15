# 八项目比较：可替换 Coding Agent 的伙伴与项目编排产品

> **新增 Memoh：**最新选择结论见[十项目综合报告](ten-project-comparison.zh-CN.md)；本文保留此前固定快照。

> **新增 Agent Swarm：**最新横向比较见[九项目综合报告](nine-project-comparison.zh-CN.md)；本文保留此前固定快照的分析。

## 1. 更新后的选择结论

加入 Cursor Projects 恢复材料与 Omnigent 后，最重要的变化是：**Omnigent 成为可以认真评估的第六条实施路线；Cursor Projects 成为项目协作层的重要产品参考。**它们分别补充了“可运行的多 harness 产品控制面”和“项目如何持续组织工作”两方面证据。

对于“具有 Grok 式长期伙伴体验、可以编排不同原生 coding agent”的目标，建议把 Omnigent、Cindy 和 AO 纳入首轮验证。Omnigent 最值得验证现成控制面的复用效率；Cindy 最值得验证伙伴、原生接入与停泊交接；AO 最值得验证长期编码任务的监督与恢复。这是源码匹配度判断，不是已测出的综合排名。[^1][^2][^3]

如果关键约束是 ACP 优先，Kandev 仍应作为 session/load、历史重放协调与执行宿主的重点参考。Omnigent generic ACP 目前更接近“多轮运行 + 产品桥接 + 重启后历史重放”；两者的恢复语义不同。Cursor Projects 恢复集没有提供足以确认通用 ACP 接入的证据。[^2][^3]

## 2. 证据与版本

| 对象 | 固定快照 | 本轮处理 |
|---|---|---|
| Kandev | `753e5549ee730245e4124654052b8b9e364d630c` | 延用原报告，补核对 ACP load/replay 实现 |
| Cindy | `f4422f816ccbadbcd29714dc0722e581bb08e172` | 延用原报告的接入、Orca 与交接判断 |
| Grok 重建版 | `a9f633e09d49a85829b8236331b9e21f7e612634` | 继续作为非官方 0.18 产品研究样本 |
| Rakazo | `b286fc4a5d0f608005000ef35bee4c473c31a165` | 延用 Bot/Computer/Routine 与 Pi runtime 分析 |
| AO | `ab968d5e761469eb32c1b4dc780cde721a9998de` | 延用 native/ACP、会话监督与恢复分析 |
| DSH | `c291e7961a515f6d7af9304e7fd1d257929aef26` | 延用插件、默认 loop 与外部一次性 agent 边界 |
| Cursor Projects 恢复集 | 研究仓 `06c9086284257611dd95d3367ee74e0cfafb05eb` | 新增；Cursor 3.20.17 客户端分发包证据 |
| Omnigent | `2a05baf4399dac074f5d29fb618bd0c7f09ec8f4` | 新增；完整仓库的关键运行路径分析 |

这不是把八个项目都更新到 2026-09-15 最新版本的横评。原六个对象保持报告基准，新增对象按本轮快照纳入；完整来源见 [sources.json](../../sources.json)。不存在对全部产品的相同环境 benchmark，不能比较任务成功率、实际时延、内存或成本。

## 3. 八对象在产品与技术链条上的位置

| 对象 | 产品重心 | 执行器关系 | 最值得继承的资产 | 到目标的最大距离 |
|---|---|---|---|---|
| Grok 重建版 | 长期伙伴、消息、电脑与后台工作 | 原自有 agent loop；新增路由能力不等价 | 伙伴关系与连续工作体验 | 运行时解耦及重建版工程边界 |
| Cindy | Desktop 伙伴与编码协作 | Claude SDK、Codex app-server、Pi RPC | 真实多引擎、能力模型、停泊交接、Orca | 重型 Desktop 装配；Worker 切换受限 |
| Rakazo | Bot/Thread/Computer/Routine | 主 Pi runtime；Computer 执行工具 | 自托管产品模型、多端和常驻电脑 | 持久原生 coding-agent 控制层 |
| AO | 编码任务监督与交付 | Chat driver 中 native Codex 与 ACP 等 | 会话监督、持久恢复、交付过程 | 长期伙伴与通用事务产品层 |
| Kandev | 看板、工作流和执行环境 | agentctl 及 ACP adapter | ACP 加载、回放协调、执行地点抽象 | 工程工作台到伙伴产品的转换 |
| DSH | 插件化 agent framework | 默认 loop 可替换；外部 provider 当前偏一次性 | 工具/能力/上下文/存储的组合 | 完整外部 session 与产品控制面 |
| Cursor Projects | 项目、主管、Worker、上下文和订阅 | 可见 Cursor 自有执行与云/本地结构 | 项目组织、成员协调、介入策略 | 无完整服务端、无已证实可插拔 runtime |
| Omnigent | 多 harness、多端会话、策略与 host | SDK、app-server、ACP、native bridge 共存 | 已实现的 meta-harness 产品控制面 | 能力不齐、交接一致性与伙伴身份 |

表中“资产”不等于代码可以无条件搬运。尤其 Cursor 与 Grok 恢复材料应按产品行为和证据使用，不能当成具有完整原始代码和许可的通用开源 SDK。[^1][^2][^3]

## 4. ACP 接管能力应如何比较

| 问题 | Kandev | Omnigent | AO / Cindy | Cursor / Rakazo / DSH / Grok |
|---|---|---|---|---|
| 是否真正控制原生 agent | ACP adapter 控制 | 多条原生路径，generic ACP 可配置 | AO/Cindy 已有真实接入 | 必须区分自有 loop、一次性委派与产品自有执行 |
| 原生会话加载 | 可见 LoadSession 与 replay barrier | generic ACP 没有 session/load，重启走历史前缀 | 按 driver/harness 分级，不能一概而论 | DSH 当前外部调用不能替代完整会话管理 |
| 工具与审批 | adapter 与方言处理 | 原生观测/宿主执行分流，policy+elicitation | 有各自原生语义，能力有差异 | UI 或权限 schema 不能证明接管任意外部 agent |
| 接入扩展成本 | ACP 核心外需维护方言 | generic ACP 配置加 vendor extension | Cindy 加 ACP 需扩展现有 BaseAgent；AO 已混合 | 其他对象仍有较多 runtime/product 新增工作 |
| 现成伙伴体验 | 主要工程工作台 | 多端会话与控制面较完整，伙伴仍需新增 | Cindy 更接近；AO 偏工程交付 | Grok/Rakazo 强于产品模型 |

“ACP 最好”应拆成两个决策：**协议恢复工程参考选 Kandev；面向多端产品的现成 meta-harness 候选优先验证 Omnigent。**若坚持所有引擎纯 ACP，Omnigent 的 native 特长不应全数计入优势，补齐 generic ACP 的 load、能力协商与可控 Worker 才是重点。[^3]

采用 ACP 优先、保留必要原生例外，当前更有机会保持原生能力；纯 ACP 可以降低接口种类，但代价是部分 fork、指令、审批和恢复需要转接或明确降级。哪一种成本更低，必须用实际选定的 agent 版本验证。

## 5. 最容易被名字掩盖的五个差别

**第一，换模型、换 harness、恢复旧原生会话是三件事。**Cursor 的模型 gateway 不是 agent 插拔接口；Omnigent 的 switch 保留产品会话不等于保留旧原生 session；Cindy 的停泊恢复也受特定场景 guard 限制。

**第二，看到子 agent 不等于拥有它。**Omnigent 自建 child session、native 内部 spawn、ACP 方言投影，控制深度不同。Cursor 的 membership/role 证据也不等于后端 Worker 生命周期完整可见。

**第三，历史可见不等于状态恢复。**聊天重放可以让任务继续，却不能证明工具调用、审批和工作区执行权延续。原生 load 也要处理回放与实时事件混流，Kandev 的 barrier 正是为此服务。

**第四，Project 默认值不是 Project 治理。**Omnigent Project config 为新会话预填；Cursor 本地项目映射帮助组织会话；新产品仍需要目标、共享决策、权限与验收记录。

**第五，声明和测试基础设施不是实测结论。**Omnigent 能力表、Cursor 恢复标签、各仓库的测试存在，都需要按实际路径解释。不能因为某字段为 true，或某文件名含 mailbox，就许诺完整功能。[^1][^2][^3]

## 6. 对原五条演进路线的影响

| 路线 | 新增证据带来的修正 | 继续选择它的理由 | 何时应转向 Omnigent |
|---|---|---|---|
| Cindy | 用 Omnigent 对照 host/runner、策略与跨端；用 Cursor 对照项目成员 | 本机伙伴、原生接入与回切最重要 | 服务端控制和多端优先，愿意重新做伙伴身份 |
| Rakazo | Omnigent 可作外部 runtime 服务候选 | Bot/Computer/Routine 是明确差异化 | 不想同时维护 Pi executor 与新会话控制层 |
| AO | 对照 Omnigent 的多端产品和工具策略 | 核心仍是代码交付、监督和恢复 | 面向更通用会话/工具平台，工程交付不是中心 |
| 独立核心 | 借鉴 Omnigent 的事件分流与能力验证，Cursor 的项目组织 | 目标语义与现有系统差异大、需长期独立控制 | 主路径能够复用多数 Omnigent 契约，重写价值不足 |
| DSH | DSH 与 meta-harness 可分层，不应再次固定唯一主管 | 插件/能力组合是核心、愿意补 runtime control | 目标优先是多原生 session，而不是经营 framework |

这些组合都是拟议架构，不是现成兼容层。例如“Rakazo 产品 + Omnigent runtime”必须划清 session、审批、文件、host 与身份的权威归属，避免两个系统都认为自己是执行控制者。不能把拼接两个开源项目当作比 fork 单个项目更便宜的默认路线。[^4]

原五份报告的详细迁移计划仍可使用，但决策时应一起阅读本次增补。第六条 Omnigent 路线在[专题报告第 11 节](omnigent-analysis.zh-CN.md#11-第六条实施路线基于-omnigent-演进)给出阶段、迁移方向、验收和停止条件。

## 7. 建议的目标结构

从八个对象交叉归纳，建议区分以下对象；这是新产品设计建议，不是任何单一项目已经实现的架构：

| 对象 | 职责 | 主要参考 |
|---|---|---|
| PartnerProfile | 长期身份、偏好、沟通关系 | Grok、Cindy、Rakazo |
| ProjectGoal / Task | 目标、依赖、归属、验收 | Cursor Projects、AO、Kandev |
| Session | 产品时间线与人类介入 | Cindy、Omnigent |
| RuntimeBinding | 原生程序、版本、native session ref、能力 | Cindy、AO、Omnigent |
| ExecutionHost / Workspace | 执行地点、进程、文件和隔离 | Kandev、Omnigent、Rakazo |
| Artifact / Decision | 成果、证据和版本化共享上下文 | Cursor 产品组织、各项目实际存储机制 |
| SubscriptionEvent / Operation | 事件去重、切换、恢复与对账 | Cursor 事件入口、Omnigent 调度边界、AO 恢复 |

LLM 主管也可以由所选原生引擎运行。平台控制层负责给它分配权限、派发任务、保存结果和处理故障；不必为了“统一编排”再引入一个不可替换的主推理 loop。

先定义最小能力和恢复契约，再选择现成底座，可以防止产品需求被既有数据库结构或 native adapter 的偶然限制绑住。与此同时，接口应由两个真实引擎的完整工作故事检验，而不是先设计一个无所不包的 Agent 抽象。

## 8. 下一步验证与路线选择门槛

建议首轮只选一个可复现的工程任务，例如修改一个小型仓库功能并增加对应验证。让主管分配两个不同引擎的 Worker，用户中途调整约束，系统记录产物与验收证据。

| 门槛 | 必须验证的行为 | 对路线判断的影响 |
|---|---|---|
| 原生保真 | 真正使用各 agent 自己的工具与多轮上下文 | 排除只替换模型或只拿最终字符串的路径 |
| 可替换主管 | 更换主管引擎仍能委派、回收结果 | 排除默认自有 loop 成为新锁定点 |
| 人类介入 | 拒绝工具、排队消息、取消和插话有不同结果 | 验证能力表没有过度承诺 |
| 恢复 | kill UI、runner、agent、server 后逐层恢复 | 区分原生 load、重放与执行未知 |
| 交接 | 在 binding 提交前后、旧进程清理前后注入故障 | 决定继承切换实现还是建立 operation log |
| 副作用 | 重连与重试不重复执行写入或外部操作 | 验证工具观测与执行责任分离 |
| 常驻 | 主机离线、错过定时、重复事件有明确政策 | 决定后台伙伴能力需要多少补建 |

若 Omnigent 的结构化两条路径和故障恢复通过，优先基于它做伙伴/项目层原型有较好理由；若主要价值来自 Cindy 的本机体验与停泊交接，保留 Cindy 路线；若验收核心是 PR 交付与持续监督，AO 仍有优势。没有运行这些验证之前，不应宣布已选定最终实现方案。

## 9. 本轮验证记录

| 检查 | 结果 | 能证明的范围 |
|---|---|---|
| 研究仓 `git pull --ff-only` | 成功，已是最新；基线含 Cursor 恢复目录 | 本轮分析使用当前研究仓资料 |
| Omnigent 克隆与 HEAD 固定 | 成功，完整 SHA 已登记 | 引用可追溯到固定源码 |
| Cursor inventory 哈希 | 70/70 一致 | 恢复文件与清单一致 |
| Cursor 现有 `npm test` | 4/4 通过，0 跳过 | DMG 哈希、切片与恢复流程 |
| Cursor 模块归属核对 | 发现初始化标记前函数与标记后相邻代码 | 文件名和 truncated 标签不能单独证明完整模块 |
| Omnigent 单测 / E2E / harness bench | 未运行；阅读了相关测试源码 | 不提供运行成功率或可靠性结论 |
| 八产品实机横评 | 未进行 | 不比较速度、价格、稳定性排名 |

本轮只新增分析材料、来源登记和阅读/下载入口，未修改七个独立上游源码仓，也未新增分发 Cursor 完整 payload。

## 来源与延伸阅读

[^1]: [原六项目源码分析](../multi-agent-grok-product-analysis.zh-CN.md)，含各项目固定提交与原始代码引用。

[^2]: [Cursor Projects 专题](cursor-projects-analysis.zh-CN.md)，含恢复边界、项目归属、Worker 协调、介入与订阅证据。

[^3]: [Omnigent 专题](omnigent-analysis.zh-CN.md)，含 ACP、原生接入、switch/store/helper、调度和测试源码引用。

[^4]: [原五条路线与新增 Omnigent 路线索引](../routes/README.md)，既有方案的迁移与阶段分析。
