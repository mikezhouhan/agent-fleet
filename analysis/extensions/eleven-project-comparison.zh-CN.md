# 十一项目比较：伙伴会话与团队交付的路线收敛

> 2026-09-16 更新：已加入 Warp Factories，最新结论见[十二项目比较](twelve-project-comparison.zh-CN.md)；本页保留十一项目基准。

## 1. 新增 Multica 后的结论

**Multica 增加了一个有真实异构小队、任务状态、执行 Daemon 和持久自动化的团队工作台候选。**如果目标先服务团队代码交付，它应与 AO、Agent Swarm 一起进入首轮验证；如果目标仍首先是 Grok 式长期伙伴、电脑、记忆和可介入的原生会话，Memoh、Omnigent、Cindy 仍更值得先验证。[^1][^2]

这个区别不在于谁的功能列表更长。Multica 的组织事实集中在 Issue、评论、Squad 和执行任务；Memoh 集中在 Bot、电脑、记忆和 Thread；Omnigent 集中在产品会话与多 harness；Agent Swarm 集中在常驻 Lead/Worker 和持久任务。选择底座就是选择先保留哪一组假设，再补哪一组能力。

Multica 使用附加条件许可，不能与无附加条件的 Apache-2.0 混列；这会影响直接 fork 为全新对外产品的路线讨论。报告只记录固定版本条款，不提供法律结论。[^1]

## 2. 范围与总表

共有十个独立源码仓库和一个 Cursor 客户端恢复材料集。Multica 固定于 `cf52ba33ccf97f756de9e6b9d364fc0a57dc5260`，其余延用前序报告快照；完整版本见 [sources.json](../../sources.json)。没有将所有对象重新更新到同一天，也没有执行统一 benchmark。

| 对象 | 主要可复用资产 | 目标产品的主要新增工程 |
|---|---|---|
| Kandev | ACP load/replay、工作区与执行宿主 | 长期伙伴、知识和通用协作产品 |
| Cindy | 桌面伙伴、原生接入、混合协作、停泊回切 | 持久交接、远端/场景边界与宿主解耦 |
| Grok Bot 重建版 | 长期伙伴体验参考 | 固定 loop 与非官方恢复范围限制 |
| Rakazo | Bot/Computer/Routine、多端基础 | 完整外部原生 session 与混合团队 |
| Agent Orchestrator | 编码会话监督、恢复与交付 | 长期身份、知识与通用事务 |
| DeepSeek Harness | 插件、能力、日志、可组合 runtime | 外部持久 Session 与完整产品装配 |
| Cursor Projects 恢复集 | 项目主管、成员和成果组织机制 | 无完整服务端，不能直接视为可运行底座 |
| Omnigent | 多 harness 会话控制面、权限桥与多端 | 伙伴/项目、交接一致性与常驻任务 |
| Agent Swarm | 持久 Lead/Worker、任务、workflow、记忆 | 交互式原生 Session、权限桥与执行权加固 |
| Memoh | 伙伴电脑、图记忆、direct/ACP 主会话、fencing | 异构 Worker、显式交接与知识授权 |
| Multica | Issue/Squad、多 CLI Daemon、持久自动化、多端 | 伙伴知识、交互审批、结构化委派与产品复用范围 |

表内为固定源码的相对匹配判断，前十项证据见[十项目报告](ten-project-comparison.zh-CN.md)及其专题，新增证据见 [Multica 专题](multica-analysis.zh-CN.md)。[^1][^2]

## 3. Multica、Memoh、Agent Swarm 与 Omnigent

| 维度 | Multica | Memoh | Agent Swarm | Omnigent |
|---|---|---|---|---|
| 产品起点 | 人与 agent 共用工作台 | 长期 Bot 与电脑 | 常驻任务组织 | 多 harness 会话控制 |
| 主管是否必须自有 loop | 否，Squad leader 为普通 agent | 否，外部主会话可用 | 否，Lead 可选 provider | 否 |
| 托管异构成员 | 已有小队和 mention 派发 | model subagent 之外仍需补 | 已有多 provider Worker | 按具体协作路径验证 |
| 通用 ACP | 依注册协议家族与专用适配；不是任意 executable 槽 | generic ACP 与 direct 分开 | 独立任务 adapter | generic ACP 与其他路径并存 |
| ACP 原生恢复 | 部分 CLI load/resume；错误分类和 fallback | cold context rebuild | 每任务新建与摘要续接 | cold history replay |
| 原生工具审批 | 多数自治自动处理 | 有权限桥与持久决策 | ACP 自动允许，workflow HITL 独立 | 有产品权限桥 |
| 长期知识 | Issue/项目/评论/技能居中 | 独立记忆形成、图存储与召回 | 团队/agent 记忆 | 伙伴知识仍需按目标建设 |
| 自动化 | 计划时点去重、租约、latest-only 补跑 | schedule 配置/日志，需补多实例与补跑验证 | 持久任务、workflow、一次补跑 | 调度以未来触发为主 |
| 默认执行边界 | Daemon OS 用户；不是平台沙箱 | Bot 工作区，后端有约束 | 按 Worker 部署与 provider | 按执行路径 |

这张表不表示所有能力已运行验证，也不能把一个项目某后端的能力套到该项目其他后端。尤其是同名 Codex/Claude 在不同产品中有不同的权限、恢复和介入实现。[^1][^2][^3]

## 4. ACP 选择应继续分题作答

Kandev 仍值得深入研究原生 load、重放协调与执行宿主；Multica 补充了大量真实 CLI 的 ACP load/resume 差异、错误分类和不可靠状态处理。Memoh 与 Omnigent 则更值得研究 ACP 如何进入有权限、消息和产品历史的交互控制面。它们擅长的不是同一层。[^1][^2]

Multica 注册 26 个 runtime identity，不等于 26 个通用 ACP adapter。Codex 用 app-server，Claude 用原生 CLI 结构化流，Pi/OMP 共用 JSON 协议家族，DSH 用专用 profile 协议，其他部分才走 ACP。要强制所有引擎 ACP，会失去已有原生适配的价值，并引入额外协议维护工作。

对于本目标，仍建议以“可替换执行引擎”为核心契约，ACP 优先，必要时保留原生适配。是否支持 resume、同轮介入、原生审批、fork、图片和特定工具，应各自展示实际能力，而不是只显示“已支持”。

## 5. 三个容易误判的产品承诺

**支持团队，不等于交付经过验证。**Multica 的 leader 操作协议与 evaluation 让协调更可见，但角色选择、派完停下、何时提 Review 仍有 prompt 约束成分。应把评论中的委派提取为可验证的目标、依赖、产物和验收，不只依赖模型说“完成”。

**Review，不等于原生工具审批。**Multica 原生 Codex 执行/文件请求自动接受，Claude 配置 bypassPermissions，共享 ACP selector 自动选会话级或一次性许可。任务交付后进入 Review，无法撤销此前已经执行的命令。若目标强调用户实时掌控，就需要新权限桥。[^1]

**恢复，不等于无副作用重放。**Multica 对 fresh retry 增加已观测工具数为零等条件，并记录被淘汰的原生 ID；它降低错误续接风险，但看不到所有 OS/外部效果。Memoh 的数据库 fencing、Agent Swarm 的任务续接和 Multica 的任务/计划去重，也都不能自动赋予邮件、合并或发布操作 exactly-once。[^1][^2][^3]

## 6. 九条演进路线

| 路线 | 演进链 | 当前最适合的前提 |
|---|---|---|
| 1. Cindy | 桌面伙伴 → 协作加固 → 持久交接 → 执行宿主 | 桌面和原生会话体验优先 |
| 2. Rakazo | Bot/Computer → 外部 Session → 原生交互 → 团队 | 重视已有通用多端产品基础 |
| 3. AO | 编码监督 → 伙伴 → 团队 → 通用事务 | 代码交付监督是核心 |
| 4. 独立核心 | 单引擎闭环 → 第二引擎 → 团队 → 恢复/远端 | 差异化明确，能承担基础建设 |
| 5. DSH | 明确宿主 → 外部 Session → 异构 Worker → 产品 | 需要可组合框架且接受装配工作 |
| 6. Omnigent | 多 harness 会话 → 交接 → 伙伴/项目 → 常驻事件 | 会话控制与引擎选择优先 |
| 7. Agent Swarm | 任务团队 → 交互 Session → 权限 → 交付/知识 | 常驻自治团队优先 |
| 8. Memoh | 伙伴电脑 → 异构委派 → 显式交接 → 恢复/知识 | 电脑、长期记忆与多渠道优先 |
| 9. Multica | 小队交付 → 结构化委派 → 长期伙伴 → 权限桥 → 恢复/隔离 | 人与 agent 共用工作台优先，并明确复用范围 |

第九条路线的阶段、通过标准、数据演进与退出条件见 [Multica 专题第 11 节](multica-analysis.zh-CN.md#11-第九条演进路线基于-multica)。全部独立报告见[路线索引](../routes/README.md)。

## 7. 对实现讨论的建议

下一步不宜继续按支持引擎数量筛选，而应确定首个完整用户故事。如果是“一个长期伙伴，拥有电脑和记忆，替我组织不同 coding agent”，先验证 Memoh、Omnigent、Cindy，并吸收 Multica 的小队和计划去重机制。如果是“一个团队任务工作台，人与 agent 协作交付代码”，先验证 Multica、AO、Agent Swarm。

共同实验应包含：更换主管 provider、两个不同 Worker、一次权限拒绝、一次用户介入、一次执行机掉线、一次原生恢复失败，以及一次外部动作成功但回传丢失。产品会话、原生 session、任务 attempt、产物和验收分别记录，才能看见某种“继续”到底恢复了什么。

新产品首版只选一个主控制面。把 Memoh、Multica、Agent Swarm 的完整控制面直接拼接，会引入多套任务所有权、重试和取消责任；借鉴某个机制往往比堆叠整个平台更容易收敛。

本轮新增 Multica 静态源码分析及路线报告，没有进行真实模型或产品运行评测；此前对象也没有被重新实测。当前仍处于架构比较阶段，尚未实现新产品。

## 来源

[^1]: [Multica 专题](multica-analysis.zh-CN.md)，包含固定提交的接入、ACP、Squad、任务、Autopilot、执行环境与 LICENSE 来源。
[^2]: [十项目综合报告](ten-project-comparison.zh-CN.md)、[Memoh 专题](memoh-analysis.zh-CN.md)、[Omnigent 专题](omnigent-analysis.zh-CN.md)、[原六项目分析](../multi-agent-grok-product-analysis.zh-CN.md)。
[^3]: [Agent Swarm 专题](agent-swarm-analysis.zh-CN.md)与[九项目报告](nine-project-comparison.zh-CN.md)，说明任务续接与原生会话的差异。
