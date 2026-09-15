# 十项目比较：长期伙伴、原生会话与异构团队的底座选择

> **新增 Multica：**最新选择结论见[十一项目综合报告](eleven-project-comparison.zh-CN.md)；本文保留此前固定快照。

## 1. 加入 Memoh 后的判断

**Memoh 使“服务端常驻、每个伙伴一台电脑、长期记忆、多原生主会话”成为一条更值得直接验证的路线。**它应进入 Omnigent、Cindy 所在的伙伴产品首轮候选，而不只是作为记忆组件参考。它的主要缺口是异构 Worker 委派和跨引擎交接；主会话接入、权限桥与运行所有权已有具体实现。[^1]

它也没有让其他路线失去价值。Agent Swarm 更偏持久任务团队；Omnigent 更偏多 harness 会话控制面；Cindy 更偏桌面伙伴与停泊回切；AO 更偏编码交付监督。目标先确定在这几类用户故事中的哪一类，才有意义比较改造量。[^2][^3]

本报告将九个独立源码仓库和一个 Cursor 客户端恢复材料集合称为十个比较对象。Memoh 固定提交 `9e02a9446f325f083722bb7e23ac6cc00a1de740`，其余保持原研究基准；不是把全部项目更新到同一天重新实测。完整版本见 [sources.json](../../sources.json)。

## 2. 十对象总表

| 对象 | 最有价值的现成资产 | 面向目标的核心改造 | 应如何使用 |
|---|---|---|---|
| Kandev | ACP load/replay、执行宿主、工作区控制 | 伙伴身份、长期知识、通用协作产品 | ACP 和 agentctl 重点参考 |
| Cindy | 桌面伙伴、原生接入、混合协作、停泊回切 | 持久交接、场景限制、宿主解耦 | 桌面优先候选 |
| Grok Bot 重建版 | 长期伙伴体验与交互参照 | 固定 loop、非官方源码可见范围限制 | 产品参考 |
| Rakazo | Bot/Computer/Routine、多端服务 | 从主 Pi runtime 补完整外部原生会话 | 通用伙伴候选 |
| Agent Orchestrator | coding 会话监督、恢复与交付链 | 伙伴、记忆、通用事务 | 编码交付优先候选 |
| DeepSeek Harness | 插件、能力、日志与可组合运行契约 | 外部持久 session、异构 Worker 与产品装配 | 框架宿主候选 |
| Cursor Projects 恢复集 | 项目主管、成员与成果组织机制 | 无完整服务端，不可直接视为可运行 fork | 项目产品参考 |
| Omnigent | 多 harness 会话控制面、权限与多端桥接 | 长期伙伴、交接一致性、常驻任务 | 会话优先候选 |
| Agent Swarm | Lead/Worker、持久任务、记忆、workflow | 原生交互 Session、权限桥、执行权加固 | 团队任务优先候选 |
| Memoh | Bot 电脑、图记忆、渠道、direct/ACP 主会话、fencing | 异构 delegation、显式交接、知识授权与调度加固 | 常驻伙伴优先候选 |

表内为静态源码匹配判断。产品覆盖面、代码规模与协议数量不能替代真实任务成功率和运维成本比较。前九项证据沿用[九项目报告](nine-project-comparison.zh-CN.md)及其专题。[^1][^2]

## 3. 最接近的四个候选，差别在哪里

| 维度 | Memoh | Omnigent | Cindy | Agent Swarm |
|---|---|---|---|---|
| 产品中心 | Bot、电脑、长期记忆与会话 | 多 harness 产品会话 | 桌面长期伙伴 | 常驻组织与任务 |
| 主执行引擎是否必须自有 loop | 否，有 direct/ACP 主运行时 | 否 | 否，按已实现路径 | 否，Lead 可选 provider |
| ACP 接入 | generic ACP 与 direct Codex/Claude 分离 | generic ACP 与其他 harness 混合 | 混合原生接入，不能称全 ACP | 独立任务 adapter |
| generic ACP 连续性 | warm 多轮；cold context rebuild | warm 多轮；cold history replay | 应按具体接入判断 | 每任务新 session，结束关进程 |
| 原生审批 | ACP/direct 有桥接；外部 waiter 随 owner 死亡失效 | 产品权限桥；能力依 harness | 按引擎路径 | ACP 当前自动允许；workflow HITL 另算 |
| 更换已有会话的 agent | 有消息后禁止 | 顶层空闲会话可切，有恢复边界 | 停泊回切等路径，有场景限制 | 通过新任务/Worker 与摘要续接 |
| 托管异构 Worker | 主要待补；spawn_agent 为 model | 按具体协作能力验证 | 已有混合协作资产 | 已有多 provider Worker |
| 持久化重点 | run/turn、历史、部分检查点、记忆 | 产品会话与运行绑定 | 伙伴与原生会话交接 | 任务、steering、workflow、记忆 |

Memoh README 仍把 Codex/Claude 描述为 ACP 托管，但当前源码已直连它们的原生协议。使用 Memoh 不意味着接受唯一自有主管 loop，也不意味着已经获得可替换的全套 Worker；这两项需要分开理解。[^1][^2][^3]

## 4. ACP 选择结论的更新

若问题是“谁最值得研究 ACP 原生 load/replay”，Kandev 仍是重点。若问题是“谁把 ACP 放进有审批、伙伴记忆和电脑的产品”，Memoh 新增了很有分量的实现参考。若问题是“谁最快搭起不同引擎的持久任务团队”，Agent Swarm 的组织层更直接。不能压缩成一个无条件冠军。[^1][^2]

Memoh 的 generic ACP 当前不提供冷启动 load；它的优势在 warm pool、作用域、permission options、取消确认、工具网关以及持久历史 head 对齐。要把所有 coding agent 强制走 ACP，还需要衡量丢失 direct Codex/Claude 原生能力的代价。继续采用“ACP 优先、必要时保留原生适配”仍是更值得验证的策略，而不是预先认定纯协议统一一定更好。

## 5. 恢复能力必须按层描述

| 层级 | Memoh 的已有实现 | 不能据此承诺的能力 |
|---|---|---|
| 用户产品历史 | PostgreSQL 历史、run/turn 归属、终态 | 所有未提交的流式文本都保留 |
| 原生上下文 | Codex 数据卷 + resume；Claude transcript/DB checkpoint；ACP cold 重建 | 所有 runtime 等价恢复 |
| 执行所有权 | 单调 fencing、owner lease、reaper、lost | 已执行外部动作被撤回或天然不重复 |
| 人类决策 | 原生权限映射、持久审批、进程内 waiter | owner 死亡后外部 waiter 原地恢复 |
| 实时输入队列 | memory/Redis 队列、claim/ack、能力门控 | 数据库中永久保存的团队任务队列 |
| 长期任务与自动化 | schedule 配置、运行日志、新/旧 session 目标 | 漏触发补跑和多 scheduler 去重已全面解决 |

这种逐层表达比单独说“支持恢复”更有选型价值。Agent Swarm 的摘要任务续接、Omnigent 的产品历史重建、Kandev 的 ACP load 和 Memoh 的分 runtime 恢复，可以互相借鉴，但不能直接当成同一种功能。[^1][^2]

## 6. 八条演进路线的变化

| 路线 | 起点到目标的主要演进 | 加入 Memoh 后的影响 |
|---|---|---|
| 1. Cindy | 桌面伙伴 → 混合协作加固 → 持久交接 → 执行宿主 | 桌面优势仍在，可参考 Memoh 的服务端归属与知识层 |
| 2. Rakazo | Bot/Computer → 外部 Session → 原生交互 → 持久团队 | Memoh 已有外部主运行时，应直接对比少补多少基础能力 |
| 3. AO | 编码监督 → 伙伴与主管/Worker → routine/通用能力 | 若编码交付是核心仍有价值，通用电脑不必首版照搬 |
| 4. 独立核心 | 单引擎 → 第二引擎 → 混合团队 → 恢复/远端 | 可借鉴 Memoh 的 fence、publication 和 lost，避免盲目重造 |
| 5. DSH | 明确宿主 → 外部 Session → 异构 Worker → 产品 | 框架灵活但装配更多，须说明为何不复用已有伙伴平台 |
| 6. Omnigent | 多 harness 控制 → 交接加固 → 伙伴/项目 → 常驻事件 | 与 Memoh 对比会话产品和电脑/记忆产品的起点差异 |
| 7. Agent Swarm | 任务团队 → 交互 Session → ACP 审批 → 交付/知识 | 团队编排领先于 Memoh 当前托管子 agent，交互基础较少 |
| 8. Memoh | 伙伴与外部主会话 → 异构委派 → 显式交接 → 恢复验证 → 知识/调度 | 新增常驻伙伴底座，重点补团队与交接 |

第八条路线的分阶段通过标准、数据演进与退出条件见 [Memoh 专题第 11 节](memoh-analysis.zh-CN.md#11-第八条演进路线基于-memoh)，全部报告见[路线索引](../routes/README.md)。

## 7. 推荐的第一轮验证

若首个完整产品故事仍是“类似 Grok 的长期伙伴，同时能编排不同 coding agent”，建议先验证 Memoh、Omnigent 和 Cindy。Memoh 验证常驻电脑与知识是否省掉大量产品建设；Omnigent 验证多引擎会话控制和切换；Cindy 验证桌面体验与混合协作。若改为任务团队优先，则把 Agent Swarm 提到首轮中心。这个顺序是目标匹配建议，不是性能排序。

所有候选使用同一验收故事：一个长期伙伴，主管可替换，两个不同 harness Worker，一次权限拒绝，一次介入，一次 owner 死亡，一次结果回传丢失，以及失败后续接。分别记录产品会话、原生 session、任务、run/turn 与文件产物，确保 UI 的“继续”对应实际可解释的机制。

不要在首版同时拼接 Memoh、Omnigent、Agent Swarm 三个控制面。它们各自拥有执行和恢复职责；直接组合会增加任务归属、取消、历史和重试冲突。选一个主底座，吸收另两家的具体机制，只有在明确责任和必要边界后再做跨系统集成。

本轮新增 Memoh 固定版本源码分析，没有运行真实模型、测试套件或部署 benchmark；尚未实现新产品。选型结论应在以上故事通过后收敛。

## 来源

[^1]: [Memoh 完整专题与第八条路线](memoh-analysis.zh-CN.md)，含 direct/ACP、记忆、切换、子 agent、fencing、审批和调度的固定提交引用。
[^2]: [九项目综合报告](nine-project-comparison.zh-CN.md)、[Agent Swarm 专题](agent-swarm-analysis.zh-CN.md)、[八项目报告](eight-project-comparison.zh-CN.md)，保留前九对象的基准与证据。
[^3]: [Omnigent 专题](omnigent-analysis.zh-CN.md)、[Cindy 演进报告](../routes/01-cindy-evolution.zh-CN.md)、[原六项目分析](../multi-agent-grok-product-analysis.zh-CN.md)。
