# 九项目比较：持续会话与持久任务团队的两种底座

> **新增 Multica：**最新选择结论见[十一项目综合报告](eleven-project-comparison.zh-CN.md)；本文保留此前固定快照。

> **新增 Memoh：**最新选择结论见[十项目综合报告](ten-project-comparison.zh-CN.md)；本文保留此前固定快照。

## 1. 新增 Agent Swarm 后的结论

**Agent Swarm 增加了一条有实际实现支撑的“常驻任务团队”路线，但没有取代 Omnigent/Cindy 在长期交互式伙伴方向上的优先验证位置。**它已有多 harness、可配置 Lead/Worker、任务领取、持久 steering、记忆、工作流与恢复机制；其核心选择却是每次任务新建原生 session，通过摘要续接。这个选择需要在选底座之前接受，不能留到开发后期再处理。[^1]

如果产品首先是“我与伙伴持续沟通，伙伴可以换 coding agent，过程中能审批和介入”，优先验证 Omnigent 与 Cindy，工程交付侧同时参考 AO。如果产品首先是“一支常驻团队持续领取工作、交付结果、沉淀知识”，Agent Swarm 应进入首轮验证。若强调 ACP 原生恢复，继续深入 Kandev 的 load/replay 与执行宿主实现。以上是固定源码的目标匹配判断，不是实测排名。[^1][^2][^3]

## 2. 九对象总表

| 对象 | 最值得复用的资产 | 面向目标产品的主要缺口 | 合理角色 |
|---|---|---|---|
| Kandev | ACP 生命周期、session/load、回放协调、agentctl 执行宿主 | 长期伙伴、通用事务与团队产品语义仍需建设 | ACP 与执行服务重点参考 |
| Cindy | 伙伴模型、真实原生接入、混合协作、停泊回切与增量交接 | 场景限制、宿主耦合、持久交接加固；不是所有接入都 ACP | 桌面伙伴底座候选 |
| Grok Bot 重建版 | 长期伙伴与自然交互的产品参照 | 非官方恢复范围有限；固定自有 loop 不符合可替换目标 | 产品参照，不能假定完整可复用 |
| Rakazo | Bot/Computer/Thread/Routine 与多端服务组织 | 主 Pi 路径需补完整外部原生 session 控制 | 通用常驻伙伴底座候选 |
| Agent Orchestrator | 多原生 coding 会话、监督、代码交付与恢复 | 伙伴身份、长期记忆与通用事务产品层 | 编码交付底座候选 |
| DeepSeek Harness | 插件、能力、日志与运行契约 | 外部 provider 主要一次性；同一 registry 只有一个 factory | 框架宿主候选，需明确 loop 所有权 |
| Cursor Projects 恢复集 | 项目、主管、成员、消息队列与成果组织的客户端证据 | 缺云端源码，切片不等于完整模块；无法确认通用 ACP | 产品机制参考 |
| Omnigent | 多 harness 产品控制面、会话与审批桥接、多端入口 | generic ACP 冷启动重放而非 load；切换与资源清理有边界 | 持续交互产品底座候选 |
| Agent Swarm | 持久任务团队、身份/记忆、steering 降级、工作流与补跑 | 主动放弃原生 resume；ACP 单任务调用、自动权限、无 live steering | 常驻任务团队底座候选 |

前八项沿用已有固定快照与专题证据，Agent Swarm 新增固定提交 `1821593fa588cea3a52f10ef5f6c4be72ce6761a`，版本 `1.148.0`。共有八个独立源码仓库与一个 Cursor 客户端恢复材料集，并非九套完整开源源码。全部版本见 [sources.json](../../sources.json)。[^1][^2][^3][^4]

## 3. “ACP 实现最好”应拆成具体问题

| 问题 | 当前源码支持的判断 |
|---|---|
| 谁最值得参考原生 load 与重放协调？ | Kandev；仍须按实际 ACP agent 的能力验证 |
| 谁更接近多引擎交互产品？ | Omnigent 的现成控制面值得优先验证；generic ACP 在进程存活时多轮，重启后新建并重放历史 |
| Cindy 是否底层全是 ACP？ | 不能这样概括；已有接入是混合原生路径，价值在真实运行能力和产品组织，不在协议统一率 |
| Agent Swarm 的 ACP 能否替换 coding agent？ | 能通过目标命令接入外部原生执行，但当前外层是一次任务 prompt，完成即关进程 |
| Agent Swarm 是否支持审批？ | 有工作流人类审批节点；ACP requestPermission 当前自动选允许项，两者不是同一层 |
| 是否有一个项目可以直接满足全部要求？ | 本轮没有足够实机证据支持这一结论；协议、产品、恢复和执行地点需要分别验收 |

Agent Swarm 的一次 prompt 内可以有大量原生推理和工具执行；“一次任务调用”不等于“调用一次模型 API”。真正限制是外层会话生命周期、后续交互与恢复接口。其短期 MCP token 是有效的访问边界改进，也不等于原生 shell 权限控制。[^1][^2][^3]

## 4. 四种连续性，不能统一写成“支持恢复”

1. **原生 session 恢复**：重新连接或加载旧的原生上下文。Kandev 的 ACP load 是重要参考，实际效果取决于目标能力。
2. **产品会话重建**：产品历史还在，新建原生 session 后回放。Omnigent generic ACP 冷恢复属于这个方向。
3. **停泊与回切**：保存某引擎旧会话，再切回并注入期间变化。Cindy 的相关路径体现这一思路，也有本地/远端场景限制。
4. **任务摘要续接**：保留任务关系、身份与成果，新任务新开 session。Agent Swarm 主动采用这一策略。

第四种更容易跨引擎与容器续接，也更容易控制上下文大小；第一、三种更有机会保留原生内部状态，但更依赖引擎及存储生命周期。第二种保留统一产品时间线，仍需诚实表达重建。任何一种都不自动保证外部副作用只执行一次。[^1][^2][^3]

## 5. Agent Swarm 最值得继承与最需要改造的部分

值得继承的是持久消息和恢复责任划分：steering 记录请求模式与实际模式，无法投递可事务性提升为后续任务；heartbeat 对普通任务续接，而 workflow-step 把重试交回工作流；claim 用条件更新竞争任务。它们把协作过程从 prompt 约定变成了可检查的状态。[^1]

需要改造的是新产品承诺与运行机制的差距。若要交互式伙伴，必须新增独立 Session/RuntimeBinding，区分产品身份、任务和原生会话；把 ACP 进程寿命从单次任务中解开，并建立持久 permission bridge。若仍以任务团队为中心，可优先加固执行权、验收证据和知识范围，保留摘要续接，改造范围会小得多。

恢复时的共同难题是“旧进程是否还在工作”。Agent Swarm 的超时、恢复 generation 上限与终态保护是有用机制，但并不能证明旧执行已经停止，也不等于外部操作幂等。新产品需验证结果回传丢失、quiet-but-live Worker 和重复触发，不能仅测试正常领取与完成。

## 6. 七条路线的演进与选择变化

| 路线 | 主要演进链 | Agent Swarm 加入后的影响 |
|---|---|---|
| 1. Cindy | 伙伴与原生接入 → 协作加固 → 持久交接 → ACP 扩展 → 执行宿主 | 可借鉴 Swarm 的任务/steering 状态，不应主动丢掉原生会话价值 |
| 2. Rakazo | Bot/Computer → session runtime → 原生交互 → 持久进程 → 混合团队 | Swarm 提供团队机制参考，但不能直接填上交互式 session 缺口 |
| 3. AO | 编码会话 → 伙伴层 → 主管/Worker → routine → 通用能力 | 可借鉴身份/记忆/workflow；保持编码交付的清晰验收 |
| 4. 独立核心 | 单引擎闭环 → 第二引擎 → 混合团队 → 恢复 → 远端 | 任务控制可参考 Swarm，会话控制参考 Kandev/Omnigent，避免一次重造全部机制 |
| 5. DSH | 确定宿主角色 → 身份 → 外部 session → 异构 Worker → 产品层 | 相比 Swarm，任务团队要补更多装配；优势仍是可组合框架 |
| 6. Omnigent | 限定 harness → 能力验证 → 交接/执行权 → 伙伴/项目 → 常驻事件 | 更适合从会话向团队演进；可借鉴 Swarm 持久任务、记忆与补跑 |
| 7. Agent Swarm | 多 harness Lead/Worker → 伙伴/Session → ACP 交互 → 执行权/验收 → 知识与多端 | 从团队向伙伴演进；若无需原生连续会话，可跳过重型 session 改造 |

各路线的详细阶段、数据迁移、通过标准与停止条件见[路线索引](../routes/README.md)。第七条完整报告在 [Agent Swarm 专题第 11 节](agent-swarm-analysis.zh-CN.md#11-第七条实施路线基于-agent-swarm-演进)。[^1][^5]

不要为了同时采用两家的优势，首版就把 Omnigent 和 Agent Swarm 两个控制面拼在一起。两者都有任务/会话状态、取消和恢复责任；未经明确归属地组合，容易出现双重调度和双重恢复。更稳妥的验证方式是选择一个主底座，借鉴另一家的机制；以后若确需集成，先定义谁拥有执行权、结果终态与重试。

## 7. 下一轮讨论应决定什么

最影响实现范围的是首个完整用户故事：用户主要是在一个长期会话中指挥伙伴，还是给一个团队持续投递任务？其次才是本地或服务器、ACP 优先或纯 ACP、创建时选引擎或原生会话中途切换。

建议用同一个故事验证候选：一个可替换 Lead、两个不同 harness Worker、一次用户介入、一次进程中断、一次验收失败后的续接。分别记录任务、产品会话和原生 session 的 ID 与变化；观察取消、恢复和重复事件，而不只看最终生成内容。验证之后再选底座，不能用 README 的支持列表推导性能或可靠性。

本轮仅新增 Agent Swarm 的静态源码分析与综合报告，未运行其测试、容器或真实模型。前八项保留原研究版本，没有宣称本轮重新测试所有项目。当前没有实现新产品。

## 来源

[^1]: [Agent Swarm 完整源码分析与第七条路线](agent-swarm-analysis.zh-CN.md)，含固定提交的 provider、ACP、resume、claim、steering、heartbeat、workflow 与 memory 源码引用。
[^2]: [八项目综合报告](eight-project-comparison.zh-CN.md)与 [Omnigent 专题](omnigent-analysis.zh-CN.md)，含 ACP 生命周期、权限、切换和调度证据。
[^3]: [六项目原始分析](../multi-agent-grok-product-analysis.zh-CN.md)，含 Kandev、Cindy、Grok 重建版、Rakazo、AO 与 DSH 固定源码证据。
[^4]: [Cursor Projects 专题](cursor-projects-analysis.zh-CN.md)，说明恢复材料的来源、可见产品机制与推断边界。
[^5]: [七条路线索引](../routes/README.md)，链接各路线完整阶段与验证条件。
