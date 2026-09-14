# 基于 DeepSeek Harness 演进多 Coding Agent 伙伴产品

## 结论

DeepSeek Harness 提供了五条路线中最明确的可组合运行时基础：Agent 接口与默认 loop 分离，工具、模型、session、持久化、上下文和其他能力通过 Cordis 组合。它适合愿意围绕插件和事件设计产品的平台团队。

但“每个组件都可替换”并不等于当前已具备“多种完整原生 coding agent 会话作为平等主管和 Worker”。现有 Codex、Claude Code、ACP 子 agent 路径主要是一次性调用；AgentRegistry 的 factory 在同一个 registry 中也只能注册一个。要完成目标，需要建设可持续的外部运行时控制与产品会话模型，而不只是加载几个包。

建议把 DSH 定位为产品的组合与能力基础，并让其默认 loop 成为一种可选执行方式。若选择让 DSH 默认 loop 始终担任主管，短期更容易复用，但需要明确接受“主管仍固定于一套 harness”的产品取舍。

## 目标与证据边界

目标是长期伙伴、主管和 Worker 都能使用不同原生 agent、多轮继续、人类介入、任务恢复和产物验收。假设团队愿意使用 TypeScript/Cordis，并重视运行时扩展；不假设必须保留 DSH 当前所有 Web/SDK 界面，也不假设可以免费得到完整外部 agent 内部事件。

现状固定于 DSH `c291e7961a51`。以下将已实现架构与拟议演进分开。未构建 DSH、安装 profiles 或运行真实 Codex/Claude/ACP 子任务；测试与文档只是静态证据，不是目标产品已通过验证。

## 当前可复用基础

DSH 的 profile 通过 bundle、home patch 和额外 patch 组合启动树。默认 agent-loop 是插件，核心 AgentRegistry 提供创建/恢复入口并委托给注册的 factory。模型、工具、存储和能力服务也可组合，注册产生可撤销 effect。[^1]

SessionEvent log 是默认 loop 模型上下文的来源；持久事件、实时 agent 事件和能力事件分开，UI 读取投影。这为审计、恢复和新能力提供了清晰参考，但该保证覆盖的是 DSH 控制的请求过程，不自动覆盖外部 native agent 的内部上下文。[^1]

| 领域 | 当前价值 | 与目标的距离 |
|---|---|---|
| Cordis composition | 服务、配置、注册和卸载有明确机制 | 仍需定义伙伴产品所有权 |
| Session log/projection | 历史与界面可从事实构造 | 外部 agent 只提供部分可观察事实 |
| Default agent loop | 可直接运行与扩展工具能力 | 如果唯一主管使用它，仍然固定主管 harness |
| Subagent providers | 多 provider 可并存 | 各 provider 的能力不同 |
| 原生 Codex/Claude | 确实调用原生产品 | 当前一次性、最终文本为主、缺乏完整交互 |
| ACP 子 agent | 可配置命令启动外部进程 | 尚无原生 continuation，人类权限交互不透传 |
| Experimental Agent Teams | roster、task DAG、mailbox 等已有设计 | 实验能力，不能等同所有外部 provider 可作为成员 |
| Desktop/Web/SDK | 已有产品和客户端入口 | 不一定适合直接承载新的伙伴模型 |

## 三个必须澄清的源码事实

### 默认 loop 可替换，但 factory 不是任意多引擎注册表

AgentRegistry.setFactory 在已有 factory 时抛错。AgentFactory 要负责 create/resume、session 发布、scope 所有权和清理，不是一个只有 `run(prompt)` 的薄接口。[^2]

这不证明 DSH 不能承载多个 harness：可以在单 factory 内分派，或使用独立上下文/产品 runtime registry。但这些都是需要设计与验证的演进，不是把两个 loop 插件同时装进同一个 registry 就完成。

### 外部子任务不等于完整 Worker

Codex provider 启动新 app-server、ephemeral thread 和一次 turn，明确不继承父上下文；Claude provider 使用一次 SDK query。两者的文档明确没有 continuation/resume/pooling 和完整人类交互，父会话只收到最终文本及受限诊断。[^3]

ACP provider 也创建新进程、新 session，权限按配置 allow/reject 自动回答，不透传给人类；continuable ACP children 仍在未完成方向中。[^4]

因此，使用默认 DSH 主管调用这些工具，可以得到异构一次性执行，但还不是可持续多 harness 伙伴产品。

### 实验团队能力不能直接消除 provider 限制

Agent Teams 有持久 roster、task DAG 和 mailbox；消息接收确认与持久 inbox 相关联，task writeScopes 只是 advisory path prefix，不是锁。该能力建立在可继续子 agent 语义上，不能因团队层存在就让一次性 Codex provider 自动具备继续与接管。[^5]

## 三种基于 DSH 的子路线

| 子路线 | 结构 | 优点 | 主要代价 |
|---|---|---|---|
| A：DSH 主管 + 外部执行工具 | 默认 loop 拆任务，Codex/Claude/ACP 做委派 | 最快复用 prompt、工具、事件、团队能力 | 主管固定；外部会话需升级；不完全满足平等可替换目标 |
| B：DSH 作为产品能力宿主 | Cordis 承载伙伴/任务/工具服务，独立 runtime registry 管理 DSH 与外部 session | 保留组合基础，执行引擎平等 | 需要新的产品事件投影与持久运行时层 |
| C：统一 AgentFactory 多引擎分派 | 一个 factory 路由多个 driver，外部 agent 实现 DSH Agent 生命周期 | 有机会最大复用现有 Agent 客户端和工具 | 需要满足复杂的 inbox、scope、日志和生命周期契约 |

如果目标坚持主管与 Worker 都可替换，建议首先验证 B。它仍以 DSH/Cordis 的组合、配置、服务和适用的能力包为基础，但不强迫外部 agent 伪装成默认 loop 的每个 step。DSH loop 作为本地 runtime 实现，可用于需要更细可控性的任务。

C 值得做小范围原型验证，而不宜直接承诺为首版主线。若外部协议无法提供当前 Agent 客户端需要的信息，就会出现大量合成事件和例外分支，最终破坏复用价值。

如果团队接受默认 DSH 主管，并更重视可编程的工具和流程，A 是合理独立路线；它的限制应该写在产品定位里，不应声称已经完成全面 harness 替换。

## 推荐目标结构与 ACP 地位

推荐结构为：DSH profile 组合产品服务，产品服务拥有 Bot、Task、Execution、Interaction、Artifact；Runtime registry 负责选择 DSH driver 或外部原生 driver；后者通过 ACP 或原生协议管理真实 session。可复用的 DSH 工具能力通过受控桥接提供，原生工具仍由外部 agent 管理。

ACP 是外部接入默认路径之一。必须区分 DSH 自己作为 ACP server 向外暴露能力，与 DSH 作为 ACP client 管理外部 agent。这是两个方向，前者存在不代表后者已经完整支持所有事件和恢复。

当前外部 provider 的一次性实现可保留给轻量任务，新建 session 型 provider/driver 给需要持续交互的 Worker。不要在旧工具名下默默改变进程寿命、权限和结果语义，避免破坏已有 profile。

## 分阶段演进

### 阶段 0：选择子路线并固定 profile

选定 A/B/C 中的主线，固定 DSH、bundle 和外部 agent 版本。使用一个专用产品 profile 明确启用哪些能力，列出默认 loop、外部 runtime、持久化、交互和 UI 的所有权。

验证一个 DSH 任务和一个原生外部一次性任务，确认它们的日志、输出与清理边界。退出条件是能准确解释哪些状态由 DSH 保证、哪些由外部产品保证、哪些尚未观察到。阶段结束前不投入大规模 UI。

### 阶段 1：伙伴与任务记录独立于 loop

创建永久 Bot Profile 与产品任务记录，native session 只是任务的一个执行绑定。将目标、约束、产物、权限交互和执行状态持久化，不把某次 default loop 的 SessionId 当作伙伴的唯一身份。

若采用 B，产品投影与 DSH 默认 Session 投影分别拥有来源；可以共享持久化基础，但不能让一个事件同时在两个系统中有不一致的事实。需要清楚的关联键与查询层。

退出条件是即便禁用默认 loop，产品仍能列出伙伴、任务、历史与成果，显示“该执行后端未启用”，而不是丢失产品身份。

### 阶段 2：一个完整外部原生 session

把外部运行从一次性调用升级为 session 生命周期：启动或加载、发送、多轮、原生会话标识、权限请求、取消、观察、idle 和恢复。Codex 或 ACP 选一条路径先做，避免同时升级三个 provider。

人类交互必须成为可持久记录并回到原请求的对象。当前 allow/reject 或非交互模式不能直接用于承诺可接管的伙伴。非交互任务可以继续使用旧 provider，但在能力上明确区分。

退出条件是同一外部会话可跨两轮继续、暂停等待用户、进程退出后有明确恢复结果，原生工具事件和最终回答能正确归属。

### 阶段 3：异构 Worker 与可靠投递

接第二个完整外部 driver，允许 DSH、Codex/Claude/ACP 中至少两种参与同一任务。主管同样通过 runtime registry 选择，不固定只有 DSH loop 能使用委派工具。

如果复用 Agent Teams，需要验证其 continuable child 与新 driver 的生命周期契约；若采用独立产品团队服务，则借鉴 mailbox 的持久接收确认，但不复制两套 team 真相。writeScopes 继续只是分工提示，实际并行写入依赖 worktree 或调度。

退出条件是不同 harness 的完整 Worker 能收到去重任务、被用户单独介入，并给主管回传带来源的产物；不因后台 job 完成而销毁仍需继续的 Worker。

### 阶段 4：日志、交接与插件卸载安全

外部执行保存宿主观察到的规范化事件及原生记录引用，明确不可见部分。不要为适配默认 loop 而生成虚假的 request/step 数据；若采用 C，必须逐项说明合成事件的语义和客户端如何辨别。

跨引擎交接传递产品目标、约束、工作区、已验证结果和历史检索引用。保留原生 session 可用于切回，但不在不同 harness 间复制专有格式。

插件卸载会撤销 effect。对持有运行中原生进程的 provider，卸载、配置热更新和升级必须先停止接收新任务，再排空、停泊或明确终止现有执行；不能撤销注册后把进程变成孤儿。退出条件是 reload/dispose 与原生任务状态一致，异常清理仍保留诊断。

### 阶段 5：产品 UI、例行工作与运行地点

确定复用现有 DSH 客户端到什么程度。若新产品对象与既有 Agent Session 有明显差异，应在适当扩展点增加伙伴投影，而不是让所有 UI 通过默认 loop 才能查询状态。

routine 和外部事件唤醒通过产品任务创建 execution；它们不应直接调用唯一默认 loop。共享工具在合适位置装配，远端执行通过 FS/subprocess/sandbox 或独立执行服务边界验证，不假设所有外部 agent 都能使用 DSH 的进程内工具。

退出条件是伙伴重启不丢历史、routine 不重复触发、用户可在界面回答外部原生请求；升级后仍可打开历史执行及其成果。

## 需要保留与重建的部分

| 模块 | 建议 | 关键验证 |
|---|---|---|
| Cordis/profile/bundle | 保留为组合基础 | 配置变更对活跃 execution 的影响 |
| 默认 agent-loop | 保留为一种 runtime | 不成为产品身份与查询的前置条件 |
| Session persistence/projection | 复用适合的存储能力与思路 | 外部事件语义、格式演进、单一事实源 |
| 原生 subagent providers | 保留一次性语义，新增持续路径 | 不静默改变现有工具契约 |
| AgentFactory | B 路线尽量不改；C 路线明确分派责任 | lifecycle、scope、inbox、dispose 全面兼容 |
| Agent Teams | 有条件复用或只借鉴机制 | 外部 provider 是否真的可继续 |
| Interaction/tools | 复用共享能力，增加外部请求桥接 | 权限归属和 native tool 不重复执行 |
| Desktop/Web client | 选择性复用 | 缺 default loop 时仍可呈现产品对象 |
| 新 Runtime registry | B 路线新增 | 各引擎可选、能力分级、持久会话管理 |

“所有东西插件化”会提高可组合性，也增加版本闭包和配置诊断成本。对用户应提供受支持的产品 profile，而不是要求用户自己组合数十个包来完成基本工作。

## 数据、上下文与恢复

DSH 默认 loop 的日志可以重建其模型可见输入；外部 agent 的日志只能保存宿主能够证明的输入、输出、交互和生命周期事实。两者用同一个 UI 呈现时，也不能抹掉证据强弱差异。

产品任务需要稳定的历史引用，native session 绑定保存版本、provider 和配置位置引用。配置热更新改变 provider 实现时，应生成新的执行代次，不让旧回调写入新的 session 状态。

持久 inbox 或 mailbox 的确认点应是目标已持久接收，而非网络写成功。外部 agent 不提供持久接受凭据时，要保留未知态并在重连时核实，不能从 DSH 本地日志已写入推断对方已经执行。

## 投入、成本和风险

相对投入：A 的一次性异构演示较低，A 的完整外部 Worker 为高，B 的完整伙伴产品为高，C 的统一 AgentFactory 兼容验证为高且不确定性更大。框架能减少基础能力重复建设，但不能省去外部协议和产品生命周期工作。

模型成本上，DSH 主管再调用外部 agent 会增加一层规划与结果综合；如果外部子任务每次都新建上下文，重复交接成本可能显著。需要测量原生 session 复用、工具 schema 体积、主管空转、返回材料大小与冷启动，而不是仅比较单个模型价格。

| 风险 | 预警信号 | 控制策略 |
|---|---|---|
| 新的唯一主管锁定 | 所有工作必须先经过 default loop | runtime 选择在产品层，主管也是角色 |
| 单 factory 被误当多 runtime registry | 安装第二个 driver 就冲突 | 选择 B 独立 registry 或显式分派 factory |
| 外部执行被伪装成 DSH step | UI 需要大量合成请求和推理事件 | 使用观测事件，明确不可见部分 |
| provider 卸载产生孤儿 | 注册已消失，原生进程仍工作 | 卸载排空与单一资源所有者 |
| 实验 Teams 被当成熟混合团队 | 外部成员不能继续或接管 | provider conformance 先于团队启用 |
| 过多 package 成为产品配置负担 | 用户必须理解 Cordis 才能用 | 提供固定受支持 profile 与诊断入口 |
| 接管破坏原生工具 | 把一切重写成 DSH 工具 | 共享工具桥接，原生编码能力保留 |

若 B 路线最终只能复用很少的 DSH 能力，却必须适配大量 Session/UI 假设，应重新评估是否更适合独立核心。若 A 已能覆盖目标且用户接受固定主管，则不应为抽象纯粹性强行迁移到 B/C。

## 验证与迁移策略

现有一次性 provider 保持不变，新 session 型实现使用明确的新能力与配置。老 profile 升级不自动启用外部权限交互或改变审批模式；产品 profile 的可执行包、配置与数据版本共同固定。

| 场景 | 通过标准 |
|---|---|
| 禁用 default loop | 伙伴与任务仍可查询，其他 runtime 可按设计工作 |
| 原生外部会话多轮 | 可继续和恢复，非每轮重新拼接全部历史 |
| 原生权限请求跨重启 | 正确恢复或明确失效，不自动扩大授权 |
| 多 provider 团队 | 真实 continuable 能力验证，不依赖名称推断 |
| provider 配置重载 | 旧运行有明确所有者，新旧事件不混写 |
| plugin dispose 失败 | 不声称进程已退出，保留恢复线索 |
| DSH 与外部日志同屏 | 清楚区分完整模型事实与宿主观测事实 |
| profile/数据格式升级 | 旧记录可读或明确拒绝，不静默改写历史 |

DSH 已有版本化 session 迁移规则，产品新增事件也需遵循其兼容约束。不能在升级后直接回退二进制并假设所有新日志仍可读；回退策略应保留历史代次、冻结新写入并使用兼容读取方式。[^1]

## 路线裁决

DSH 路线的核心选择是要一个可编程的 DSH 主管，还是一个让所有原生 agent 平等参与的产品宿主。前者可以更快复用，后者更符合全面可替换目标，但新增执行控制面工作不可避免。

最先应验证的三个实验是：不依赖 default loop 的产品对象查询、一个完整外部 native session 的交互/恢复、provider 卸载或重载时的资源生命周期。通过后再决定采用 B，或是否值得升级为 C 的统一 AgentFactory 实现。

## 来源

以下均为 DeepSeek Harness 本地快照 `c291e7961a51`，未来子路线不属于现成能力。

[^1]: DeepSeek， [架构](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/docs/architecture.md)，profile、loop、事件、session 格式与客户端边界。
[^2]: DeepSeek， [AgentFactory](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/core/agent/src/index.ts#L166)、[setFactory](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/core/agent/src/index.ts#L355)、[Agent runtime types](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/core/agent/src/runtime-types.ts)，单 registry 的 factory 与生命周期契约。
[^3]: DeepSeek， [Codex provider](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-codex/README.md)、[Codex 实现](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-codex/src/index.ts#L63)、[Claude provider](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-claude-code/README.md)。
[^4]: DeepSeek， [ACP provider 实现](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-acp/src/index.ts)、[ACP 能力边界](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/subagent/subagent-acp/README.md)。
[^5]: DeepSeek， [Agent Teams](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/docs/subsystems/agent-team.md)、[Subagent 契约](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/docs/subsystems/subagent.md)。
