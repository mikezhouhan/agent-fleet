# 多 Coding Agent 伙伴产品的十条演进路线

原五份报告分别从不同底座出发，分析如何演进为长期伙伴、多原生 coding agent、可介入协作和可恢复执行的产品。各报告独立包含目标、源码现状、架构取舍、阶段与退出条件、数据迁移、风险、成本结构、验证与停止条件，可以单独阅读。

本轮是路线分析，未修改六个项目源码，未执行产品构建或真实模型验证。没有把规划、接口声明或现有测试源码当作已通过实机验证的能力；也没有用未经验证的固定工期包装估算。

## 报告入口

| 路线 | 完整报告 | 核心演进方向 |
|---|---|---|
| 1. Cindy | [基于 Cindy 演进](01-cindy-evolution.zh-CN.md) | 现有伙伴与原生接入 → 混合团队加固 → 持久交接 → ACP 扩展 → 独立执行宿主 |
| 2. Rakazo | [基于 Rakazo 演进](02-rakazo-evolution.zh-CN.md) | 伙伴与 Computer → session 型 runtime → 原生工具/审批分流 → 持久进程 → 混合协作 |
| 3. AO | [基于 AO 演进](03-ao-evolution.zh-CN.md) | 可靠编码会话 → 长期伙伴 → 主管/Worker 产品化 → 例行任务 → 通用工具 |
| 4. 独立核心 | [独立新建核心](04-independent-core-evolution.zh-CN.md) | 单引擎完整闭环 → 第二引擎验证抽象 → 混合团队 → 交接恢复 → 长期伙伴与远端 |
| 5. DSH | [基于 DeepSeek Harness 演进](05-deepseek-harness-evolution.zh-CN.md) | 明确框架角色 → 产品身份 → 完整外部 session → 异构 Worker → 生命周期与产品 UI |

## 新增第六条路线：Omnigent

[Omnigent 完整分析与演进路线](../extensions/omnigent-analysis.zh-CN.md)补充现成 meta-harness 底座的选择：限制接入范围 → 验证能力 → 持久交接与执行权 → 伙伴/项目模型 → 常驻事件与远端。报告明确 generic ACP 的 cold replay、顶层空闲会话切换限制、两次数据库提交与异步资源清理边界。

[八项目综合报告](../extensions/eight-project-comparison.zh-CN.md)比较新增材料对原五条路线的影响。[Cursor Projects](../extensions/cursor-projects-analysis.zh-CN.md)作为产品模式与客户端证据参考，不作为可直接 fork 的完整底座路线。以下表格保留原五条路线的基准分析。

## 新增第七条路线：Agent Swarm

[Agent Swarm 完整分析与演进路线](../extensions/agent-swarm-analysis.zh-CN.md)从持久任务团队出发：验证多 harness 主管 → 伙伴与交互 Session → ACP 会话化 → 执行权与验收 → 知识和多端。其原生 resume 主动弃用、ACP 自动权限与工作流审批分层，是选择此底座前需要理解的前提。

加入 Agent Swarm 时的选择结论见[九项目综合报告](../extensions/nine-project-comparison.zh-CN.md)。原五份路线和第六条 Omnigent 路线保留各自基准，新增路线不等于替代已有结论。

## 新增第八条路线：Memoh

[Memoh 完整分析与演进路线](../extensions/memoh-analysis.zh-CN.md)从常驻伙伴、独立电脑与 direct/ACP 主会话出发：冻结运行基线 → 异构 Worker 委派 → 显式交接 → ACP 与恢复验证 → 知识权限与调度。当前有消息的会话禁止更换 agent，托管子 agent 仍为 model，外部审批 waiter 丢失不能原地恢复；这些边界决定改造重点。

加入 Memoh 时的选择结论见[十项目综合报告](../extensions/ten-project-comparison.zh-CN.md)。Memoh 新增常驻伙伴候选，不改变前七条路线各自固定版本的事实。

## 新增第九条路线：Multica

[Multica 完整分析与演进路线](../extensions/multica-analysis.zh-CN.md)从 Issue/Squad 与执行 Daemon 出发：验证异构小队 → 结构化委派 → 长期伙伴与显式交接 → 原生权限桥 → 恢复、隔离与交付。已有多协议接入和持久计划去重，但原生工具权限偏自治，普通 Chat 不能等同于无损跨引擎切换；直接 fork 的复用范围还需考虑其附加条件许可。

最新选择结论见[十一项目综合报告](../extensions/eleven-project-comparison.zh-CN.md)。前八条路线保留对应版本的事实与完整方案。

## 新增第十条路线：Warp Factories 平台集成或机制借鉴

[Warp Factories 完整分析](../extensions/warp-factories-analysis.zh-CN.md)从异构软件工厂出发：验证可替换主管 → 决定控制面归属 → 补长期伙伴 → 显式交接和权限 → 评价驱动迭代。已公开客户端、配置示例与文档，Oz 编排服务仍专有，因此此路线不能称为完整开源 fork。ACP 仍为计划，不将 Factory MCP 误写成 ACP 接管。

最新综合判断见[十二项目比较](../extensions/twelve-project-comparison.zh-CN.md)。

## 五条路线的不同起点

| 维度 | Cindy | Rakazo | AO | 独立核心 | DSH |
|---|---|---|---|---|---|
| 最匹配的首个用户 | 本机长期伙伴用户 | 常驻、多端、共享电脑用户 | 多任务代码交付用户 | 具有明确差异化需求的目标用户 | 可编程伙伴/平台用户 |
| 最大可复用资产 | 原生接入与伙伴/协作产品 | Bot/Computer/服务端/多端 | 会话恢复与工程交付控制 | 可选取各家成熟机制 | 插件、能力、日志与组合体系 |
| 最大新增工作 | 切换边界与宿主解耦 | 持久原生 agent 控制层 | 伙伴、记忆、routine、通用能力 | 整个产品控制与恢复基础 | 完整外部 runtime 与产品模型 |
| 是否已有完整多原生主会话 | 有，能力按引擎/场景区分 | 主 Pi 路径没有 | 有，按 driver 分级 | 从零接入 | 外部 provider 当前主要一次性 |
| 首版部署倾向 | 本地 Desktop | 服务器或本地 Docker 栈 | 本地 daemon | 按目标决定，建议先本地 | 专用 profile/产品宿主 |
| 主要长期风险 | 上游同步与装配复杂度 | 双重工具责任、lease/进程一致性 | 工程模型不适合通用伙伴 | 范围失控与重复造基础设施 | 新的唯一 loop 锁定或契约适配过重 |

这些是基于固定源码的相对判断，不是性能或稳定性排行榜。框架能力越多并不必然意味着到目标产品的距离越短；关键在于需要改变哪些已有假设。

## ACP 与 agentctl 对路线的影响

ACP 是通信协议；agentctl 式服务管理执行地点、进程、工作区和控制通道。采用 ACP 不自动获得原生 session 持久恢复，也不自动具备远端运行能力。

| 约束 | 对路线选择的影响 |
|---|---|
| ACP 优先，允许必要原生例外 | 五条路线均可评估；Cindy/AO 保留已有原生价值，新增 ACP 逐项验证 |
| 所有引擎必须 ACP | Cindy/AO 需要额外协议迁移；Rakazo/独立核心可从新接口开始；DSH 仍需升级一次性 ACP client |
| 首版只在本机运行 | 不必立即建设远端 agentctl，但需要明确进程所有权 |
| 关闭 UI 后必须继续 | 需要常驻执行宿主，不能让窗口拥有任务寿命 |
| 首版即本机/SSH/容器并存 | 执行服务是核心工程；Kandev 是横向参考，而非本轮新增的第六条底座路线 |

无论哪条路线，纯 ACP 的价值都应通过能力与维护成本验证。若为了统一而失去原生 fork、审批或恢复，需要明确这是产品取舍，不是透明协议迁移。

## DeepSeek 路线为何需要额外决策

DSH 的报告单独比较三个子路线：默认 DSH 主管调用外部 agent、DSH 作为产品能力宿主、单一 AgentFactory 内多引擎分派。

默认 DSH 主管最容易复用，但主管固定；产品能力宿主更符合执行引擎平等的目标，却需要新的 session 控制与产品投影；多引擎 factory 有机会复用更多现有客户端，但必须满足复杂的 inbox、scope、日志和生命周期契约。

这一差别源于实际源码：同一 AgentRegistry 仅能设置一个 factory，而当前 Codex/Claude/ACP provider 不能直接提供完整持续 Worker。报告没有将“插件化”自动等同于“目标已经实现”。

## 共同的决策门槛

各路线都应围绕相同的工作故事验证，但不要求使用同一内部实现：一个长期伙伴接收目标，一名可替换的主管委派两个不同引擎 Worker，用户可介入其中一个，系统保留产物与验证证据，应用重启后可以继续。

| 门槛 | 需要看到的结果 |
|---|---|
| 原生保真 | 真正使用 agent 的多轮会话与工具，非仅调用模型 API |
| 人类介入 | 审批、问答、插话和停止语义明确 |
| 恢复 | 接受未知、进程存活未知被明确处理，不盲目重发 |
| 协作 | 归属、回传与验收可追溯，重复事件不会重复推进 |
| 交接 | 目标、约束、成果和工作状态连续，不承诺内部上下文无损 |
| 资源 | workspace、Computer、账号、工具执行地点明确 |
| 产品 | 用户管理伙伴与工作，不必理解协议和进程 |

## 当前建议与阅读顺序

若先做开发者产品，建议按 AO → Cindy → 独立核心阅读；若先做 Grok 式通用伙伴，建议按 Rakazo → Cindy → 独立核心阅读。DSH 报告适合在明确是否愿意保留自有默认 loop 或采用插件宿主之后阅读。

仍待决定的不是五条路线哪一个绝对最好，而是以下优先级：本地轻量与服务器常驻、编码交付与通用事务、创建时选择引擎与运行中切换、ACP 优先与纯 ACP、快速 fork 与独立长期核心。

已有总览可配合阅读：[六项目源码分析](../multi-agent-grok-product-analysis.zh-CN.md)。各独立报告末尾列出精确源码与固定提交，便于回到证据核对。

2026-09-21 起，独立核心不再以「再写一个 JSON workflow」为默认。第一性原理规格见 [Coding-Agent-Neutral Cloud Agent 平台设计](../first-principles-cloud-agent-design.zh-CN.md)：Beads 语义做 Task 图，LoopX 合同做 tick，自研 MicroVM Run；不把两家内核同时嵌进产品。
