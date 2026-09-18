# 十二项目比较：伙伴、原生会话、任务团队与软件工厂

更新日期：2026-09-16。新增 Warp Factories，旧对象沿用原固定快照；没有把十二个对象重新升级并执行统一测试。版本与证据类型见 [sources.json](../../sources.json)。

## 1. 加入 Warp 后的结论

**Warp 是很有价值的异构软件工厂参照；完整控制面未公开，ACP 尚不能列为现成能力。**官方支持 Foreman 使用 Claude Code/Codex，其价值不只是多模型，而是主管与成员都能使用不同原生 harness。公开客户端有 CLI 驱动与原生 transcript 恢复，工厂配置有角色、自动化、runner 和评估；Oz 服务仍为专有部分。详见 [Warp 专题及第十条路线](warp-factories-analysis.zh-CN.md)。

这使原有问题更清晰：需要同时比较产品体验、原生接入深度、团队控制面与能否自主部署。一个产品可以异构接入做得好，却不能直接作为可 fork 的完整后端；一个底座源码完整，也可能离长期伙伴体验很远。

## 2. 十二项目总表

| 项目 | 产品起点 | 多 coding agent / ACP | 持续性重点 | 主要优点 | 面向目标的主要差距 |
|---|---|---|---|---|---|
| Kandev | 编码工作台和执行宿主 | ACP 为重要接入路径 | load、重放协调、进程与工作区 | ACP 生命周期和执行地点解耦 | 长期伙伴、知识与通用事务 |
| Cindy | 桌面伙伴 | 原生与 ACP 混合，非全 ACP | 停泊会话回切、增量上下文 | 伙伴体验与多原生交互接近目标 | 持久交接、远端边界、宿主解耦 |
| Grok Bot 重建版 | 长期伙伴 | 固定自有 loop | 产品体验参考 | 伙伴、工具和持续工作的整体组织 | 非官方重建；替换引擎需结构改造 |
| Rakazo | Bot / Computer / Routine | 主 Pi 路径，需补外部持续 runtime | Bot、电脑与例行任务 | 常驻、多端和通用伙伴模型 | 原生 session、权限责任与异构团队 |
| Agent Orchestrator | 编码监督与交付 | native Codex + ACP 等 | 编码会话监督和恢复 | 工程交付闭环 | 长期身份、记忆、非编码场景 |
| DeepSeek Harness | 可组合 agent 框架 | 外部 provider 主要一次性 | 插件、能力和日志 | 自定义底座灵活 | 完整交互式外部 Session 与产品装配 |
| Cursor Projects 恢复集 | 项目主管和成员 | 客户端材料不足以证明通用 ACP | 委派幂等、排队合并、中断抑制、状态权威性分级 | 客户端编排与逐工具审批实现参考 | 无完整云端源码，无可替换引擎，非可直接运行底座 |
| Omnigent | 多 harness 会话平台 | SDK/native/ACP 混合 | 权限桥、会话历史、引擎切换 | 原生会话控制接近目标 | cold replay 非原生 load；伙伴与持久交接 |
| Agent Swarm | 常驻 Lead/Worker 组织 | 多 provider，ACP 每任务执行 | 持久任务、workflow 与摘要接续 | 异构组织与任务自动化 | 主动弃用 native resume；ACP 权限自动处理 |
| Memoh | 长期 Bot、电脑和知识 | direct Codex/Claude + generic ACP | 原生/重建分流、fencing 与消息提交 | 伙伴知识、执行电脑、外部权限桥 | 托管异构 Worker；有消息会话不能直接换 agent |
| Multica | Issue / Squad 工作台 | 多原生 CLI 与专用 ACP 家族 | 领取、重试、调度计划去重 | 异构团队、Daemon、多端任务交付 | 伙伴知识、原生人工审批；附加条件许可 |
| Warp Factories | 软件交付工厂 | Foreman/成员可不同 harness；ACP 仍是计划 | 专用 CLI transcript 恢复；服务端 inbox 为官方声明 | 定义即代码、异构角色、评估与改进闭环 | Oz 闭源；自托管主要执行面；通用伙伴需另建 |

前十一项证据与边界沿用[十一项目综合报告](eleven-project-comparison.zh-CN.md)及其专题；Warp 每项事实在 [Warp 专题](warp-factories-analysis.zh-CN.md)中指向固定源码或官方文档。Cursor 一行按 1047 单元恢复集更新，依据见[深度分析](cursor-projects-deep-dive.zh-CN.md)。本表是结构比较，不是性能排名。

## 2.1 Cursor 恢复集扩容后的两处修正

恢复集从 70 个单元扩到 1047 个后，有两条此前的表述需要更正，另有一条得到确认：

- **逐工具人工审批存在。**先前因证据不足只把 Memoh、Omnigent 列为有产品权限桥。Cursor 客户端有按终端、MCP、编辑、计划、WebFetch 分型的 review model，以及用户/项目/管理员三层 `permissions.json` 与 sandbox 读权限文件的实际加载逻辑，`approvalMode` 取值为 `allowlist`/`unrestricted`/`manual`。服务端是否强制仍未知。
- **客户端有真实的多 subagent 执行控制。**先前把 Cursor 的持续性重点写成"界面"层面。实际可见 `toolCallId` 幂等重放、父子归属校验、被取代 ID 保留、排队追加消息合并、完成结果延迟上报、树级中断与失败通知抑制、本地并发上限，以及任意深度的子 agent 嵌套（带防环）。这一项与 Warp 明确限制的一层 parent/children 形成直接对比。
- **通用 ACP 仍无证据。**全部 1047 个单元中 `acp` 只作为结构化日志频道名 `agent_acp` 出现，没有 ACP client、`session/load` 或可替换 executable 注册。原结论不变。

这些修正提升了 Cursor 作为**实现参考**的等级，没有改变它不是可 fork 底座的结论。

## 3. 不要混为一谈的能力

| 要解决的问题 | Warp 当前证据 | 与既有候选比较的正确方法 |
|---|---|---|
| 主管可替换 | 官方明确 Foreman 可用 Claude/Codex | 与 Agent Swarm、Multica 等真实异构主管比较 |
| ACP 接管 | FAQ 为计划；可见驱动是 CLI 专用实现 | ACP load/replay 优先研究 Kandev，权限桥研究 Memoh/Omnigent |
| 任意 agent 参与 | Factory MCP 可提交/取回工作 | MCP 参与不等于平台托管运行，也不等于 ACP |
| 原生恢复 | Claude/Codex transcript 重建并 resume；Gemini 有差距 | 按具体引擎验证，不用产品总分掩盖差异 |
| 人工批准 | 流程指令和仓库权限；无人值守 CLI 绕过原生权限提示 | 与交互式工具审批分开统计；分型 review 与权限文件分层参照 Cursor，产品权限桥参照 Memoh/Omnigent |
| 本地接手 | MCP pickup 不领取锁，也不暂停云端 | 对照任务 claim、lease 与 fencing，验证重复工作风险；委派幂等键与被取代 ID 记录参照 Cursor |
| 自托管 | 执行机器可自管，控制面仍依赖 Warp | 与完整自主后端分列，避免“VPC=完整离线” |
| 自动改进 | scorer 失败触发改进 PR，人工审核 | 与长期记忆形成分开；评价不是学习模型权重 |

## 4. 对原路线的影响

| 首要目标 | 优先验证的路线 | Warp 的位置 |
|---|---|---|
| Grok 式服务器常驻伙伴、电脑与记忆 | Memoh；同时比较 Rakazo 的产品模型 | 可作为编码工厂供应商，伙伴层另建 |
| 桌面伙伴 | Cindy | 参考交付证据和任务组织，不必 fork 整个终端 |
| 多引擎交互、权限与切换 | Omnigent / Cindy | 借鉴专用会话恢复；不能替代 ACP 验证 |
| 持久异构任务团队 | Agent Swarm / Multica | 直接产品参照；若接受服务依赖可进行集成试验 |
| 编码监督与交付 | AO / Multica | 分角色验收与评估闭环参考 |
| 自主 ACP 宿主 | Kandev 机制 + 所选产品核心 | 当前不是完整开源 ACP 候选 |
| 自定义平台 | 独立核心 / DSH 产品宿主 | 借鉴身份/运行/机器分离与配置版本化 |

这里的“优先”是当前固定证据下的架构试验顺序，不是购买建议或实测胜出结论。原九条演进路线不被替换，新增第十条是 **Warp 平台集成或机制借鉴**，不是声称有第十个完整可 fork 服务端。

## 5. 下一轮讨论应收敛什么

先确定是否必须拥有完整控制面，以及首版是长期伙伴还是团队交付。若坚持原来的长期伙伴目标，仍应从 Memoh、Omnigent、Cindy 中收敛核心，再借鉴 Kandev 的执行控制、Agent Swarm/Multica 的任务组织、Warp 的配置评估闭环和 Cursor 的委派幂等与介入语义。不要把这些项目的完整控制面一起拼接。

若首版改为软件工厂，则可比较 Warp 托管集成、Multica、Agent Swarm 与 AO，使用相同真实任务验证：异构主管委派、用户介入、进程故障、任务续接、成果验收与重复执行处理。比较结果应同时记录实现工作量、服务依赖、失败行为和可导出数据。
