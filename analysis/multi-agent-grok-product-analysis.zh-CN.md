# 面向可替换 Coding Agent 的 Grok Bot：六项目源码分析

> **新增 Memoh：**最新选择结论见[十项目综合报告](extensions/ten-project-comparison.zh-CN.md)；本文保留此前固定快照。

> **新增 Agent Swarm：**最新横向比较见[九项目综合报告](extensions/nine-project-comparison.zh-CN.md)；本文保留此前固定快照的分析。

分析日期：2026-09-14。范围：当前已克隆的六个仓库，产品模型、运行时接入、编排、上下文、恢复和复用价值。本报告是源码与文档分析，不是实现方案或运行性能评测。

> **2026-09-15 增补：**比较范围已扩展到八个对象，见[八项目综合报告](extensions/eight-project-comparison.zh-CN.md)、[Cursor Projects 专题](extensions/cursor-projects-analysis.zh-CN.md)与[Omnigent 专题](extensions/omnigent-analysis.zh-CN.md)。本文保留原六项目固定快照分析；Omnigent 已加入实施底座候选，Cursor Projects 补充项目协作参考。新的横向选择结论以增补报告为准。

## 1. 判断先行

你的目标可以定义为：**用户拥有长期存在的 AI 伙伴，伙伴能够使用不同的原生 coding agent 工作，并把多个 agent 的工作组织成一个可持续、可介入、可验证的过程。**

这需要同时保留两种价值：Grok 的长期伙伴体验，以及原生 coding agent 已经成熟的执行能力。只增加模型下拉框不能实现这个目标；只把多个终端放进看板，也不能实现这个目标。

六个项目各有最值得参考的一部分：

| 项目 | 最有价值的参考 | 对本目标的主要不足 | 我的定位 |
|---|---|---|---|
| Grok 重建版 | 长期伙伴、消息流、群组、工具与桌面体验的结合 | 原有 runtime 耦合；新增 Router 不是完整的多 harness 控制面；成品 UI 依赖原始二进制 | 产品研究样本 |
| Cindy | Claude Code / Codex / Pi 的真实接入、伙伴、跨引擎交接与 Lead/Worker 协作 | Desktop 集成层重；部分切换场景明确不支持；公开仓不含服务端 | 最接近目标的现成产品参照 |
| Rakazo | Bot / Thread / Computer / Routine 的产品模型，以及可自托管、多端的服务架构 | 主运行时仍为 Pi agent-core；原生 coding-agent 会话控制需要补建 | 最值得评估的伙伴产品底座 |
| Agent Orchestrator，简称 AO | 原生 agent 监督、结构化 Chat、持久恢复、跨 agent 切换、Git/PR 交付 | 主要面向软件项目；终端支持与 Chat 支持深度不同 | 最重要的多 harness 控制面参照 |
| Kandev | agent 与执行环境分离、agentctl、ACP、工作流与多种 executor | 工程工作台复杂度高；ACP 转接仍有方言；Office 自治能力在进行中 | 执行环境与工程流水线参照 |
| DeepSeek Harness，简称 DSH | loop/工具/上下文/存储都可组合，事件与能力契约清楚 | 原生 Codex/Claude 子任务当前一次性；采用默认主 loop 仍需经营一套 harness | 可选执行引擎与基础设施设计参照 |

**最值得优先交叉阅读的是 Cindy + AO；最值得对照 Grok 研究产品结构的是 Rakazo。**不建议直接选一个仓库全盘继承，也不建议把六个系统拼成一套。

## 2. 证据范围与置信边界

| 仓库 | 本次分析提交 |
|---|---|
| kandev | `753e5549ee73` |
| cindy | `f4422f816ccb` |
| grok-bot-0.18-reconstructed | `a9f633e09d49` |
| rakazo | `b286fc4a5d0f` |
| agent-orchestrator | `ab968d5e7614` |
| deepseek-harness | `c291e7961a51` |

证据包括 README、架构与产品规则、实际组合入口、运行时接口、协议适配、交接代码及相关测试源码；另查看了 Rakazo 产品主图与 Kandev 工作台截图。没有启动六个产品，没有执行其测试套件，没有调用付费模型，也没有进行速度、内存、任务成功率、成本或稳定性的对照测试。

因此，本文的“支持”“限制”以指定快照中的代码路径为依据；文档描述单独标明。测试存在只说明作者为该行为设计了回归约束，不代表本次验证通过。体验判断是产品结构分析，不是六款应用的完整实机测评。Grok 的结论尤其只覆盖这个非官方 0.18 重建仓，不能外推为官方当前版本的全部情况。

发现文档冲突时采用组合入口和实现为准。例如 Kandev 的旧 `docs/ARCHITECTURE.md` 混有 NATS/PostgreSQL/微服务规划，而新的 public architecture 与 adapter factory 给出了更明确的当前结构。

## 3. 首先分清四种“支持多个 Agent”

| 层次 | 实际发生的事情 | 是否满足你的目标 |
|---|---|---|
| 换模型 | 同一个 loop 调不同模型 API | 不充分 |
| 调原生 agent 做一次任务 | 启动一次 Codex / Claude，拿最后结果 | 适合一次性委派，但不充分 |
| 管理原生 agent 会话 | 原生会话可继续、暂停、审批、观察、恢复 | 必需 |
| 编排多个原生会话 | 委派、回传、并发、归属、验收、交接都可管理 | 目标的核心 |

另外必须区分：**多个 agent 并行**与**同一任务中切换 agent**。前者需要独立会话和成果聚合；后者需要持久交接和执行权迁移。支持其中一个，不代表另一个自动成立。

“Agent”还容易同时指伙伴身份、原生执行程序、临时子任务。新产品若一开始把三者合成一张记录，后续每次换引擎、换电脑、压缩上下文都会影响用户所认识的伙伴。

## 4. Grok 重建版：应该继承其产品组织方式，谨慎看待代码底座

### 已核实的结构

仓库明确说明：这是从公开发行二进制重建的非官方研究项目。可读 `frontend/` 是部分重建；实际打包继续使用固定哈希的原始 renderer，再应用少量设置界面修改。因此，“拿到仓库”不等于“拿到完整、可自由演进的原始 React 产品源码”。见 [README](https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/README.md) 与 [PROVENANCE](https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/PROVENANCE.md)。

原有执行体系可以看到 `AnysphereAgent`、ConversationState、SummarizationOrchestrator，以及 user/resume/cancel/goal continuation/background task 等 action handler。产品生命周期已经进入 agent 内部结构，而不是一个薄薄的聊天窗口。[原有 Agent 根实现][grok-root]

新增 Router 的几个名字含义不同：

| Router 选项 | 核实到的实现 | 对原生能力的含义 |
|---|---|---|
| Cursor | 保持原有路径 | 原有 Grok 体系 |
| Codex | 读取本地认证，直接请求 Codex Responses 服务，自己执行 tool loop | 没有启动完整 Codex app-server 会话 |
| Claude Code | 调 Claude Agent SDK，限定 Grok MCP 工具，`persistSession: false` | 确实使用 SDK，但不是完整、持久的 Claude 工作会话 |
| OpenRouter | 模型接口与宿主工具循环 | 模型后端替换 |

Codex 路由设置有工具时最多 8 步；Claude 路由设置最多 8 turns，而且这里只读取 SDK 的最终 result，再产出文本。不能因为 README 写着保留 streaming，就推定各路由都提供原生工具事件和逐 token 体验。[Codex 路由][grok-provider]、[Claude 路由][grok-claude]

Router 的持久记录是额外的 JSON transcript，保留最近 200 条，主要存 user/assistant 文本和反应，再与远端 transcript 合并。这个限制属于新增 Router，不能误说成整个 Grok 都只存 200 条。它揭示了一个问题：新执行路径是嫁接进既有产品，而不是一套统一、完整的 runtime/session 模型。[Router 与 transcript][grok-router]

### 优点与值得学习之处

其价值是把“能做事”放入一个连续的人际交互形态：有长期伙伴、有消息入口、有工具与电脑、有背景工作与回报。用户可以围绕一个伙伴形成连续关系，而不必每次创建一个临时终端。

代码中的群聊编排并非毫无限制地广播：它按成员、轮次、新消息、PASS 语义和总消息上限运行，并能通过 epoch 判断取消。用户消息、agent 消息和后台工作也有不同调度 lane。这些设计对于避免 agent 互相闲聊、后台工作压住用户插话，都有参考价值。[群聊编排][grok-groups]、[运行调度][grok-scheduler]

### 缺点与本目标的距离

原有 loop、状态、工具、交互协议耦合较深；现有 Router 缺少统一原生会话生命周期。要加一个可恢复、可审批、可插话的 coding agent，不是替换一次推理请求就能完成。

重建代码还有大量宽类型、恢复语义和打包覆盖边界。其维护负担来自追踪一个外部二进制产品，和从零维护自己产品的方向不同。仓库 NOTICE 也没有授予原始产品源码授权；这里仅记录仓库声明，不据此作法律结论。[NOTICE](https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/NOTICE.md)

**判断：把它作为体验与行为参考最有价值；以当前混合打包结构作为全新产品底座，会继承与目标无关的恢复和兼容成本。**

## 5. Cindy：最接近“长期伙伴 + 多原生 Harness”的现成组合

### 已核实的结构

`maker-core` 提供 BaseAgent，分别实现 ClaudeCodeAgent、CodexAgent、PiAgent。Codex 有 app-server transport/client/host，Claude 有 SDK 集成，Pi 有 RPC 与 extension bridge。这里的适配层处理真实 agent 的会话、事件和能力，不只是把模型请求换到另一个 API。[BaseAgent][cindy-base]、[Agent 导出入口](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/agents/index.ts)

能力模型也比 `supportsTools: true` 更细：fork、rewind、same-turn steer、extra directories、permission mode、plan mode 等单独声明；不可用还区分 SDK 缺失、尚未实现和平台限制。这是维护产品诚实性很好的范例。[能力声明][cindy-cap]

Orca 把 Lead 和 Worker 都做成完整 session。三种 harness 可担任 Lead 或 Worker；MCP 与 UI 复用主进程 service，避免同一行为从两个入口执行时出现不同规则。消息派发有排队、回传、归属与 idle release，而不仅是 `Promise.all`。[Orca 权威文档](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/docs/dev-rules/orca-team-architecture.md)

伙伴产品文档还明确区分永久 Profile、长期主时间线、可重建的原生执行上下文。这与本目标高度吻合。[伙伴运行时](https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/docs/product-rules/cindy-bots-runtime.md)

### 最值得学习的交接设计

切换引擎先记录意图，在下一次发送时真正应用。离开的原生会话被保留；切回时优先 resume，并注入离场期间的增量；首次切到新引擎则构建完整交接。

交接不是复制整个内部上下文：代码采用近期 4 个用户轮次、较早信息提要、工作状态与原文检索指引，并限制字符预算。详细历史保留在产品中，需要时通过工具检索。[切换实现][cindy-switch]、[交接构造][cindy-handoff]

这是一个合理承诺：保持任务连续，让新引擎有足够信息继续，而不是声称可转移原生隐藏状态、压缩格式或推理过程。对应测试包含 Claude → Codex → Pi → Claude → Codex，以及停泊线程失效后的恢复场景；本次仅阅读测试。[切换测试][cindy-switch-test]

### 当前边界与代价

**普通任务可切换，不代表所有 Worker 可切换。**当前实际 guard 明确拒绝 remoteHostId 和 orcaRole 的跨引擎切换，也限制归档与特定 Review 任务。因此，“混合三种引擎创建协作团队”已经有实现，“正在协作的某个 Worker 任意换引擎”不能据此宣称成立。[限制代码][cindy-limit]

Orca 仍以单 Lead team 为中心，不能跨 Lead 共享 Worker；当前文档明确 workflow_run 尚未纳入实现。默认 Worker 继承 Lead 目录，不能等同于每个 Worker 自动获得独立 worktree。

工程上，BaseAgent 仍出现 Claude SDK、Codex、Pi 的专有类型，Desktop 的注册、IPC、账号、工具与主机准备链也较重。说明“有统一抽象”和“可直接抽出一个独立 SDK”不是同一回事。复用时应逐个验证依赖闭包。

公开仓仅含客户端与共享包，服务端在独立仓库。不能从客户端开源推定整套官方账号、同步与分发基础设施已经全部可自托管。

**判断：Cindy 最能回答“你要的产品是否有接近的实现”。适合重点研究；若直接 fork，需要接受其 Desktop 与既有服务集成的包袱。**

## 6. Rakazo：最自然的伙伴产品骨架，但多 Harness 仍是实质缺口

### 已核实的结构

产品主语是 persistent bot，配合 conversation、memory、routine 和 computer；前端包括 Web、Electron、Expo，服务端包括 API、worker、PostgreSQL、Graphile Worker。它提供完整自托管路径，而 Desktop 主要连接或启动同一套服务。[README](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/README.md)

外部能力集中在 adapter-kit，sandbox、memory、voice、connector 等各有边界。主 AgentRuntime 接口是 `describe / run / abort`，请求带 history、instructions、tools、model、executeTool、claimSteering 等；事件包括 text、tool、ask、usage、checkpoint、subagent、done。[运行时接口][rakazo-interface]、[请求和事件][rakazo-events]

但生产组合入口只在 ScriptedAgentRuntime 与 PiAgentRuntime 之间选择。PiAgentRuntime 导入的是 `pi-agent-core` 的 Agent，给它装入 Rakazo 的工具和上下文；这与运行 Pi coding-agent CLI 的完整环境不同。[组合入口][rakazo-root]、[Pi 适配][rakazo-runtime]

### 优点

Bot 与一次运行分开，电脑资源与 Bot/Thread 分开，长期记忆与本轮输入分开，产品模型容易延展为长期数字同事。代码还提供工具执行和 steering 的宿主回调，为接入不同运行时留下了位置。

共享电脑、私有电脑、图形操作、浏览器、终端、文件、接管和例行任务，都是 Grok 式产品真正需要的能力。只做 coding-agent launcher 往往最后要重新补这些。

服务端运行让关闭桌面窗口后仍可工作变得自然；多端只是不同入口。对需要远程常驻、手机介入的方向，这种架构的价值明显。

运行清理还强调先取消并结算工具，再释放所有权；相关测试覆盖取消、丢失 lease、暂停与消费者异常。说明它已经处理一些真实异步运行问题，而不是只有聊天 UI。[清理实现](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/runtime-stream.ts)、[测试](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/runtime-stream.test.ts)

### 缺点与需要补建的部分

当前接口更像宿主拥有工具与上下文的“执行一次 run”。完整原生 coding agent 还需要原生 session handle、resume、动态能力、审批回应、原生 fork、当前 turn steering 等更丰富的协议。接口已有 checkpoint 字段，不等于所有运行时已实现持久原生会话恢复。

内部 subagent 仍通过 Pi Agent 创建；多模型 helper 不能等同于多 harness Worker。仓库另有 cloud-agent 集成边界，也不能直接算作主对话的原生 harness 替换。

PostgreSQL、worker、Docker 栈为常驻和多端提供基础，但提高了纯本地桌面安装门槛。若用户目标是轻量 Mac 应用，需要单独权衡这个成本。

**判断：如果目标偏“通用伙伴、共享电脑、长期后台工作”，Rakazo 很值得做底座评估；如果目标核心是原生 coding agent 保真接入，不能把增加一个 adapter 估计成小改动。**

## 7. AO：最值得借鉴的多 Harness 会话控制面

### 已核实的结构

Go daemon 负责长生命周期工作，Electron/React、Mobile、CLI 作为入口。外部系统通过 ports/adapters 接入，SQLite 存事实，数据库 change log 驱动事件。显示状态由 agent、PR、CI、review 等事实推导。[架构文档](https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/docs/architecture.md)

AO 明确把 TUI Agent/Runtime 与结构化 ChatDriver 拆开：终端字节不是 Chat 事件；一个会话只允许一个当前控制器；无法恢复不能悄悄创建新对话来冒充恢复成功。[Chat 契约][ao-chat]

README 宣称 27 个 coding agents，但当前 Chat registry 注册的是 **9 个**：Codex、Claude Code、OpenCode、Droid、Kimi、Kimchi、Pi、Cursor、OMP。Codex 走原生 app-server，其余这些 Chat 路径走 ACP；其余支持主要为 TUI，具体功能还要看 probe。9 个已注册也不等于 9 个在任意机器上都已安装、认证和满足能力门槛。[驱动清单][ao-drivers]

### 优点

它对“用户点击停止之后究竟发生了什么”“重启后是否仍有 agent 活着”“同一个审批被两个客户端回答”“切换时谁有权继续写文件”这些问题有明确建模。

原生 Chat 的生产能力门槛包括流式、审批、中断和恢复，并针对显式 bypass 权限模式做区分。不是有一个可执行文件就宣称完整支持。[Chat 能力门槛][ao-chat]

跨 agent 切换是持久化流程：保留 provider-native session，记录 source/target generation，使用 CAS、幂等键、handoff 文件及其 hash，确认源停止与目标确认后激活。交接可以组合确定性事实、源 agent 提交的结构化语义说明，以及受限历史；缺乏语义交接时仍保留可核对的事实。[切换存储][ao-store]、[切换流程][ao-switch]

这比“停止 A、把聊天全文塞给 B”更可靠。原生 session 可用性还有 available/unavailable/unknown 三态，避免把一次探测失败当作会话已死。[原生会话探测][ao-native]

### 缺点与本目标的距离

产品主要围绕 project、worker、worktree、PR 展开。即使已有 browser 和 project orchestrator，也不天然等于长期伙伴、个人记忆、例行事务与跨应用生活工作入口。

支持面分 TUI 与 Chat，产品若想保持统一精致消息体验，不能以 27 个名字为目标直接打开所有入口；终端模式在能力、审批、事件解释上有不同维护成本。

持久 host、恢复、switch saga、数据库、Go/TS 协作构成真实工程复杂度。其复杂度有不少是为了可靠性，值得借鉴，但不应在首版照搬所有状态与遥测流程。

**判断：如果未来产品的关键差异是“真正保留多个 coding agent 的原生能力，并可靠编排”，AO 的控制面设计比单纯模型 router 更接近问题本身。**

## 8. Kandev：执行环境和软件交付结构最值得参考

### 已核实的结构

当前 public architecture 描述为 server-first workbench：一个 Go binary 内嵌 Web，Tauri 是桌面壳；agentctl 在本地或远端环境管理 agent、文件、Git、terminal 和 MCP relay。SQLite 默认，也支持 PostgreSQL；事件总线默认内存，可配置 NATS，但事件总线本身不是持久回放。[当前架构](https://github.com/kdlbs/kandev/blob/753e5549ee730245e4124654052b8b9e364d630c/docs/public/architecture.md)

当前结构化协议 factory 只接受 ACP，源码明确说明非 ACP transport 已移除。Codex 使用 `@agentclientprotocol/codex-acp` 等转接。这与 AO 的“Codex 原生协议 + ACP 其他驱动”是不同取舍。[Factory][kandev-factory]、[Codex 定义][kandev-codex]

Executor 有 local、worktree、Docker、远端 Docker、SSH、Kubernetes、Sprites 等不同选择，agent profile 与 executor profile 是两个维度。

### 优点

最有价值的是不把“运行什么 agent”和“在哪里运行”写死在一起。以后同一个 Codex Worker 从本机迁往远端环境，不应要求产品重新定义任务、审查和结果归属。

agentctl 把远端执行能力集中到明确的进程边界，比前端直接启动 CLI 或让每个 provider 分别实现 SSH、Docker 更可维护。

工作流、计划、审查、Git/PR 与任务相邻，适合把编排结果接到软件交付，而不是得到几段看似完成的聊天回复。任务交接提示也要求新会话核对当前代码，避免重复此前工作。[交接提示](https://github.com/kdlbs/kandev/blob/753e5549ee730245e4124654052b8b9e364d630c/apps/backend/config/prompts/session-handover.md)

### 缺点与本目标的距离

ACP 统一了通信表面，但适配目录仍存在不同 agent 的 dialect/enricher。协议统一不会自动统一模型控制、工具展示、usage、fork、恢复和审批语义。

丰富 executor、工作流、插件、后台管理构成较大的产品面。若目标首先是低摩擦的个人伙伴，这些概念不宜全部进入默认 UI。

Office 自治系统在当前 public architecture 中明确标为 feature-flagged、in-progress，也不是普通任务产品的受支持扩展 API。不能因为源码树存在 Office，就把完整自治办公室当作成熟可复用能力。

根 LICENSE 为 AGPL-3.0；本报告只记录授权文本标识，与其他几个宽松许可仓库存在明显区别，不在这里推导具体商用义务。

**判断：更适合学习环境抽象、agentctl 与交付流程；如果全盘作为 Grok 式产品底座，容易继承一个开发工作台的产品复杂度。**

## 9. DeepSeek Harness：确实更可替换，但需要分清替换哪一层

### 已核实的结构

Cordis 用插件组合服务、事件和可撤销 effect。模型、工具、session、agent-loop 都可以通过配置组合或替换；agent 接口与默认 agent-loop driver 分开。这是真正的结构可替换性，不只是替换 LLM provider。[架构](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/docs/architecture.md)

session log 是模型上下文来源；模型可见信息必须能够从日志重建。step、turn、tool 与持久事件的关系写得很清楚；同时明确某些实时流只在进程内，进程在 settlement 前硬退出并不保证留下完整实时 attempt。这是有边界的持久性承诺。

subagent 是独立能力，支持多个 provider 并存，包括 in-process、fork、ACP、Codex、Claude Code、DSH SDK。不是一个“只能用 DeepSeek”的固定代理壳。[Subagent 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/docs/subsystems/subagent.md)

### 优点

可学习其插件注册、配置组合、日志投影、工具拦截、能力声明与取消语义。新行为应挂到能力或事件，不必不断修改主循环。

原生 Codex 子任务确实启动 app-server，不是伪装成 Codex 的普通模型 API；Claude 子任务使用官方 Agent SDK。两者都有对应集成和真实产品测试源码，边界文档也比笼统的“支持多 agent”更精确。[Codex provider 源码][dsh-codex]

### 关键限制

当前这两个原生 provider 是一次性委派：新进程、新原生会话、一个 turn/query；结果主要是最终文本与受限诊断。不提供原生 continuation/resume/pooling，不把进度、完整工具流、diff、usage 复制到父 session，没有完整人类审批/问答路径。

这与 DSH 自身支持 continuable subagents 不矛盾：框架有能力，不代表每个 provider 实现了该能力。当前 Codex provider 也明确 `inheritsParentContext = false`。[Codex 限制](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-codex/README.md)、[Claude 限制](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-claude-code/README.md)

因此，若以 DSH 默认 loop 作为唯一主管，接 Codex/Claude 当一次性工具，仍与“主管和 Worker 都可换 harness、可继续、可介入”的目标存在距离。不是架构做不到，而是现有实现不能直接提供。

**判断：适合做可选运行时，或借鉴日志与插件设计。如果你确实不想经营自己的 loop，就不应仅因它开放而把默认 loop 设为不可替换的产品中心。**

## 10. 横向比较：哪些能力能直接说明问题

| 维度 | Grok 重建版 | Cindy | Rakazo | AO | Kandev | DSH |
|---|---|---|---|---|---|---|
| 主要产品对象 | 伙伴/消息 | 伙伴、任务、团队 | 伙伴、线程、电脑 | 项目、Worker | 任务、工作流 | Session、能力、插件 |
| 原生多 harness 主会话 | Router 不充分 | 三类已接入 | 主路径尚未实现 | 已实现，按驱动分级 | 已实现，经 ACP | 默认为自身 loop；外部委派另有 provider |
| 跨 harness 交接 | 新增路径以文本重放为主 | 有停泊/增量，场景受限 | 未从主 runtime 核实 | 有持久切换流程 | 有任务/会话交接，不等于任意原生状态迁移 | 外部 Codex/Claude 不可续接 |
| 多 agent 编排形态 | 群组与调度 | Lead / 完整 Worker | peer bot + Pi helper | 项目主管 + Worker | 工作流 + agent/executor | provider-based subagent，另有实验团队能力 |
| 长期伙伴产品贴合 | 高，原始体验参考 | 高 | 高 | 要补产品层 | 要补产品层 | 要补产品层 |
| 环境抽象价值 | host/box/local Docker | 本地/SSH/device-link | Computer + sandbox provider | worktree/scratch/runtime | executor + agentctl | FS/subprocess/sandbox seams |
| 本地产品负担 | 重建打包与原始 artifact | Electron 与大量集成 | 完整服务栈和 Docker | daemon、SQLite、原生 agent | Go backend、agentctl、选定 executor | profile 与插件运行时 |

表中的“未核实”不等于断言整个仓库没有；也不把文档规划、接口声明、测试 fake 算成生产能力。

## 11. 对全新产品最重要的七个结论

### 11.1 伙伴身份必须独立于原生会话

同一个“工程伙伴”今天用 Claude、明天用 Codex，不应丢失名字、记忆、任务和历史。一个原生会话过期，也不应意味着伙伴消失。

概念上应分开 Bot、产品任务/线程、Execution、原生 Session 和 Workspace/Computer。这不是要求现在设计五张表，而是先确认五者生命周期不同。Cindy 的伙伴运行时、AO 的 stable session/native session、Rakazo 的 Bot/Computer，都在不同部分支持这一判断。

### 11.2 编排层可以自己拥有，模型执行循环不必自己实现

需要自己拥有的，是工作归属、委派、结果回传、用户插话、失败恢复与验收；不必重新实现每家 coding agent 的模型请求、工具选择、压缩与内部推理循环。

主管也是一个角色，应能由不同 harness 承担。若 Worker 可替换而主管永远固定在自研 loop，锁定只是从执行层移到了主管层。

这不要求永远没有自定义引擎。未来需要更精细控制时，可以把 DSH 或自研 runtime 作为另一个可选执行后端，而不是产品身份和历史的唯一主人。

### 11.3 能力按真实边界暴露，不能只有共同最小集合

最低共同能力应覆盖启动、发送、观察、停止和明确终态；长期 Worker 还应核实恢复与交互路径。fork、rollback、原生 plan、usage、same-turn steer 等应保留为可选能力。

“下一轮排队”“立即打断重开”“当前 turn 插话”是三种不同语义，不能都命名为 send。无法支持某项能力时，界面应解释具体原因；不能用模拟输出伪装原生支持。

ACP 很有价值，但它是接入路径之一。是否把某家原生协议放在 ACP 后面，应该由保真度和维护成本决定，不能因为统一看起来漂亮就放弃需要的能力。

### 11.4 产品记录、原生上下文、共享记忆需要分别治理

产品记录回答“之前发生了什么”；原生上下文决定下一次模型真正看到什么；共享记忆记录长期偏好、约束和事实。三者不是一份不断加长的 messages。

跨引擎交接应该保留目标、约束、已做工作、当前文件状态、验证证据、未解决问题、下一步与来源引用。新引擎核对现场，按需检索原文；不要尝试移植专有压缩结构或隐含状态。

“任务连续”可以作为目标，“原生上下文无损迁移”不应作为未经验证的承诺。切回旧引擎时保留旧原生 session 并补增量，是比反复全量重放更值得评估的方式。

### 11.5 工具共享的核心是执行地点和身份

浏览器登录态、桌面控制、文件路径、MCP 凭证可能在不同机器。一个云端 Codex 能列出工具，不代表它能使用本地已登录浏览器。

共享工具层需要明确：调用者是谁、属于哪个任务、在哪台电脑执行、使用哪个账号、结果文件在哪里。并保留原生 agent 的基础 coding 工具，不为了统一而全部换成宿主劣化版本。

权限也有两层：产品共享工具权限、原生 agent 本身的权限。只控制 MCP 不代表已经控制原生 shell；两层如何对应需要明确表达，不能假设自动等价。

### 11.6 停止、重试和完成都需要真实证据

请求被接收、turn 结束、产物生成、验收通过是不同事实。Agent 说“完成了”不等于测试通过；程序退出不等于没有仍在运行的子进程；断线不等于 agent 已死。

对并行编码，worktree 能隔离 Git 状态，但不会隔离数据库、端口、外部 API 或浏览器状态。对共享电脑，也需要决定谁拥有当前交互执行权。

重试尤其不能直接重放有副作用的整轮任务。可恢复控制面需要知道上次到达什么边界、什么动作结果未知，再决定续接、重查或请用户介入。AO 的 generation 和 Rakazo 的工具清理顺序说明了这类问题的实际形态。

### 11.7 Grok 的低摩擦体验需要独立设计

技术上支持多个 CLI 只是前提。用户仍需要知道：哪个伙伴在做什么、是否需要我、产物在哪里、能否插话，以及为什么值得长期使用它。

默认界面宜围绕伙伴、主消息流、成果与需要介入的事项；Worker 细节、终端、diff、执行环境可以按需展开。不要把 agent 名称、协议、worktree、队列、host 等全部变成用户每次开始工作的必选项。

这些是从项目比较导出的产品建议，不是已决定的 UI 或实现规范。

## 12. 可供下一轮讨论的路线

| 路线 | 适合的优先目标 | 需要付出的主要代价 |
|---|---|---|
| 以 Cindy 为基础演进 | 尽快得到本地伙伴 + 多原生 harness + 协作 | 梳理 Desktop 集成与独立服务边界，补场景能力，不轻视现有复杂度 |
| 以 Rakazo 为产品骨架 | 长期在线、多端、自托管、共享电脑的伙伴产品 | 建立真正的多原生 session 管理层，扩展现有 run 型接口 |
| 以 AO 为核心扩展 | coding agent 保真、多任务交付、恢复和切换最优先 | 增加长期伙伴、记忆、routine、通用工具产品层，重塑交互 |
| 新建产品核心，定向参考 | 长期差异化与清楚的所有权边界 | 初期更多工程投入，必须严格控制首批 harness 和场景范围 |

我目前更倾向于：**新产品以独立的伙伴/任务模型为核心，重点借鉴 Cindy 的多 harness 体验和 AO 的会话控制；是否复用 Rakazo 的产品骨架，取决于本地优先还是服务器常驻优先。**这个倾向是架构判断，不是已经完成的工期或成本估计。

不建议现在先选 Electron/Tauri、Go/TypeScript 或写一个通用 agent SDK。更影响方向的讨论有四项：

1. Grok 最值得保留的是长期伙伴、主动后台工作、共享电脑、群聊协作，还是其简洁交互？这些价值的优先级是什么？
2. 产品首先服务个人本地电脑，还是一组可远程常驻、手机介入的伙伴？
3. “多个 coding agent 编排”首先要求不同 Worker 用不同 harness，还是必须同一 Worker 随时切换？
4. 首要用户是需要可靠代码交付的开发者，还是把 coding agent 当通用执行器的知识工作者？

两种路线都能做到多 agent，但默认产品对象、后台常驻位置、工具部署和验证标准会明显不同。

## 13. 进入实现讨论前，最有区分力的验证场景

后续若选择候选底座，应优先验证以下场景，而不是比较支持的 agent 名称数量。本次尚未执行这些验证。

| 场景 | 需要观察的事实 |
|---|---|
| 同任务 Claude → Codex → Claude | 产品任务不丢，原生 session 有明确归属，增量交接不重复执行 |
| Lead 用一种 harness，两名 Worker 用另外两种 | 委派结果可追溯，用户能单独介入，主管能准确验收 |
| 中途出现审批，随后重启产品 | 审批归属仍正确，任务不被假定成功或自动越过 |
| 用户运行中补充约束 | 能分清当前 turn steering 与下一轮排队，补充不丢不重 |
| 同一项目两个 Worker 同时写代码 | 工作区归属明确，变更可比较并合并，验证产物有来源 |
| 远端 agent 使用本机浏览器或产物 | 执行位置与权限真实，文件路径和账号上下文可理解 |
| 定时任务跨重启继续 | 调度不漏不重，失败有记录，外部副作用不盲目重放 |
| 原生 agent 升级 | 能力变化能被识别，旧会话可恢复或明确解释不能恢复 |

速度与成本也应按同任务、同模型、同权限和同工具配置测量，并区分模型耗时、启动耗时、桥接开销与重试开销。仅从代码语言或架构层数不能推断谁更快、更便宜。

## 14. 复用材料的授权标识

| 项目 | 仓库根文本 |
|---|---|
| Kandev | AGPL-3.0 |
| Cindy | Apache-2.0 |
| Rakazo | Apache-2.0 |
| AO | Apache-2.0 |
| DSH | MIT |
| Grok 重建版 | NOTICE/PROVENANCE 不授予上游原始源码授权；仍依赖原始 renderer |

这张表只记录当前仓库文本，不代替对具体文件、资产、依赖和分发方式的核对。无论最终采用哪个底座，都应独立设计新产品品牌与视觉资产。


[grok-root]: https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/source/packages/agent/index.ts#L40
[grok-provider]: https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/source/host/extensions/inference/provider-session.ts#L167
[grok-claude]: https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/source/host/extensions/inference/provider-session.ts#L203
[grok-router]: https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/source/node-agent-coordinator/inference-router.ts#L52
[grok-groups]: https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/source/host/extensions/transcript/group-chat-orchestrator.ts#L32
[grok-scheduler]: https://github.com/b-nnett/grok-bot-0.18-reconstructed/blob/a9f633e09d49a85829b8236331b9e21f7e612634/source/host/extensions/transcript/run-scheduler.ts#L53
[cindy-base]: https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/agents/base-agent.ts#L2
[cindy-cap]: https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/packages/maker-core/src/types/capabilities.ts#L10
[cindy-switch]: https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/sessionAgentSwitchHandler.ts#L2
[cindy-limit]: https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/sessionAgentSwitchHandler.ts#L420
[cindy-handoff]: https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/agentHandoff.ts#L69
[cindy-switch-test]: https://github.com/makecindy/cindy/blob/f4422f816ccbadbcd29714dc0722e581bb08e172/apps/desktop/src/main/maker-ipc/__tests__/sessionAgentSwitchHandler.test.ts#L170
[rakazo-runtime]: https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/pi-runtime.ts#L102
[rakazo-root]: https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/apps/worker/src/index.ts#L67
[rakazo-interface]: https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapter-kit/src/interfaces.ts#L229
[rakazo-events]: https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapter-kit/src/types.ts#L373
[ao-chat]: https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/ports/chat.go#L11
[ao-drivers]: https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/adapters/chatdriver/registry/registry.go#L66
[ao-switch]: https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/session_manager/agent_switching.go#L39
[ao-store]: https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/ports/agent_switching.go#L15
[ao-native]: https://github.com/Untrivial-ai/agent-orchestrator/blob/ab968d5e761469eb32c1b4dc780cde721a9998de/backend/internal/ports/agent_continuation.go#L59
[kandev-factory]: https://github.com/kdlbs/kandev/blob/753e5549ee730245e4124654052b8b9e364d630c/apps/backend/internal/agentctl/server/adapter/factory.go#L13
[kandev-codex]: https://github.com/kdlbs/kandev/blob/753e5549ee730245e4124654052b8b9e364d630c/apps/backend/internal/agent/agents/codex_acp.go#L19
[dsh-codex]: https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-codex/src/index.ts#L63
