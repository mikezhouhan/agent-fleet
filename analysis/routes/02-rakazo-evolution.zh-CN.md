# 基于 Rakazo 演进多 Coding Agent 伙伴产品

## 结论

这条路线最适合“长期在线的 AI 伙伴，有自己的电脑，用户从桌面、浏览器或手机介入”的产品。Rakazo 的优势集中在伙伴与电脑的产品模型、完整服务栈、自托管和跨端入口；多原生 coding agent 则是需要新建的核心执行能力。

推荐保留 Bot、Thread、Computer、Routine、API、数据库和多端界面，逐步把执行层从单一 Pi run 扩展为可持续的多 harness session。首个技术难点不是 ACP 握手，而是把现在由宿主掌控工具执行的流程，与原生 agent 自己执行工具的流程协调起来。

如果期望只是增加一个 adapter 文件就获得 Codex、Claude 的完整原生体验，这条路线会被严重低估。它适合愿意建设执行控制层、同时希望复用大量伙伴产品能力的团队。

## 目标、假设与证据边界

目标是长期伙伴、原生 coding agent 混合协作、后台运行、人类接管和可验证产物。分析假设以服务端常驻和多端访问为优先，本地 Docker 可作为个人部署方式；首批只选择一种 computer provider 与两种 agent。严格轻量、无需服务栈的桌面应用不作为该路线默认目标。

现状固定于 Rakazo `b286fc4a5d0f`；“阶段”和“建议”均为未来演进，不是仓库已具备能力。未执行发布镜像、真实模型任务或故障注入，不声称 checkpoint、lease 或测试源码已经证明完整原生会话恢复。

## 当前基础与真实缺口

Rakazo 已有 persistent bots、memory、routine、peer bot 与 helper、Computer、浏览器/终端/文件/桌面操作，以及 Web、Electron、Expo。API 与 worker 使用 PostgreSQL、Prisma、Graphile Worker；Desktop 可连接既有实例或启动 Docker 栈。[^1]

主运行时组合入口在 ScriptedAgentRuntime 与 PiAgentRuntime 间选择。Pi 适配使用 `pi-agent-core` 的 Agent，把 Rakazo 的 instructions、history、tools、model 装入初始状态；它不是已经集成多个完整原生 coding-agent CLI 的会话管理器。[^2]

当前 Pi 本身运行在 API/worker 进程，Computer 中主要运行被工具控制的桌面、浏览器与命令。后续把原生 coding agent 放进 Computer 是执行位置的实质变化：要同时处理其认证、安装、工作目录和存活时间，而非替换同一进程内的一次函数调用。[^1]

| 现有抽象 | 已解决的问题 | 原生 harness 仍需要什么 |
|---|---|---|
| AgentRuntime.run/abort | 一轮事件流与取消 | 长期 native session、attach/resume、请求回应 |
| AgentRunRequest | 模型、历史、工具、steering 回调 | 引擎标识、版本、配置引用、会话策略 |
| AgentRuntimeEvent | text/tool/ask/usage/checkpoint/subagent/done | 原生请求 ID、turn 归属、能力与原始事件来源 |
| Run lease | worker 执行所有权与过期处理 | 活着的原生进程是否可重连，是否仍在执行 |
| Computer | 执行环境与交互接管 | 各原生 agent 在该环境的安装、认证与路径 |
| Approval effect | 宿主工具请求的审批与重放 | 原生权限请求与外部工具审批的区别 |

接口字段提供了扩展位置，但不是能力实现的证明。例如 `resumeFromCheckpoint` 不能被直接解释为恢复 Codex 原生 thread。[^3]

## 目标架构与所有权

推荐让产品层继续拥有 Bot、Thread、Run 和 Computer；在 Run 与实际 agent 之间增加 Harness Session 管理。一个 Thread 可以经历多个 execution，每个 execution 绑定一个原生 session，原生 session 可以跨多轮运行继续存在。

Graphile job 是调度和唤醒载体，不应同时成为原生进程寿命的唯一所有者。进程可以由电脑内的执行服务持有，worker 领取 job 后建立或重连控制通道。服务端失联时先标记控制状态未知，再根据执行服务证据恢复，不能仅因 job lease 到期而再启动一个同任务 agent。

工具必须分两类：Rakazo 提供的共享能力，如已连接应用、电脑观察和 peer 通信；原生 agent 自己提供的 coding 工具，如 shell、编辑和搜索。前者可继续由宿主执行，后者通常由原生引擎执行并向产品发送事件。不能把后者的通知再次当作“待执行工具请求”运行一次。

## ACP 与 agentctl 选择

这一底座适合 ACP-first：新增一个 session 型 ACP runtime，负责初始化、能力发现、创建/加载、prompt、取消、权限请求和事件转换。但请求入口不能只机械沿用当前 run 参数，把原生 agent 当接收一整份 messages 的模型。

Computer 是自然的部署边界。可在 Computer 内放置 agentctl 式执行服务，管理 agent 安装、进程、native session、workspace 与 MCP relay。它通过经过认证的控制通道与 worker 通信；云端 worker 不直接假定能读取用户本机配置。

若 Codex 的原生能力明显超过所选 ACP bridge，可在同一个 Harness Session 契约下保留原生 driver。必须把“ACP 是默认接入”与“所有功能只能通过 ACP”分开决策。Pi 旧路径应继续存在，作为现有用户和功能的兼容实现。

## 分阶段演进

### 阶段 0：固定服务栈与一台 Computer

选择一个部署方式和一个 computer provider，验证账号、模型、浏览器、文件、工具连接、routine 的真实工作链。记录 API、worker、数据库、电脑之间的边界与文件存储位置。

首阶段的产品结果是一个长期 Bot 完成真实工作，应用关闭后仍能从另一个入口查看结果。此时不接多种 sandbox、不扩语音供应商。退出条件是生产入口可解释、状态位置明确、备份后能恢复产品历史与电脑数据。

### 阶段 1：增加 session 生命周期而不破坏 Pi

建立产品 Thread/Run 到 native session 的绑定，明确 startup、running、waiting interaction、detached/unknown、idle、terminated 的事实。不要把所有新状态塞进现有 RunStatus：一个 run 已结束，session 仍可继续；控制通道断线，agent 也未必结束。

Pi 继续使用原路径，标明它的上下文由宿主装配；新增 runtime 的能力逐项声明。事件保留 provider、native session、turn、execution 和请求关联，内部保留诊断引用，面向用户投影简化。退出条件是现有 Pi 行为不变，新 runtime 可用脚本夹具走完持久状态链。

### 阶段 2：接入第一个完整原生 agent

在选定 Computer 内运行原生 agent 或 ACP bridge，支持多轮、原生工具事件、权限问答、停止和恢复。把 Rakazo 共享能力通过 MCP 或等价桥接提供给它，不劫持其每一次原生 shell 调用。

审批尤其需要分流：宿主共享工具继续使用现有 approval effect，原生权限请求则回答原请求 ID 和选项。进程已死后不能把审批批准转为“重新生成同一个工具调用”。退出条件是原生 agent 在真实工作区完成任务，等待审批后继续，并在 worker 重启后能找回正确会话。

### 阶段 3：增加第二引擎与团队工作

新增第二个原生 driver，以同一 Harness Session 契约验收，检验第一版抽象是否只适配首个引擎。允许不同 Bot 或 Worker 选择不同 harness；继续使用产品的消息和后台 job 机制承载委派。

已有 Pi helper 可以保留为轻量一次性执行。需要继续追问、用户介入、独立成果的工作应创建完整 Worker execution；两种执行对象在 UI 中可相似，但生命周期不能混同。

编码 Worker 显式选择独立 worktree 或有序共享目录。peer bot 的长期身份不能被一次代码任务的归档一起删除。退出条件是主管可以委派、收到去重结果、定位产物，用户能独立介入一个 Worker。

### 阶段 4：加固接管与后台恢复

现有 executor 用 leaseOwner/leaseFence 等约束领取与执行，并在丢失 lease 时取消工作。新原生进程可能跨 worker 存活，必须增加执行服务对运行代次的确认，而不能让数据库 lease 和真实进程各自得出不同结论。[^4]

电脑接管需要明确作用域：用户接管图形桌面是否暂停全部工作，还是只暂停依赖屏幕的工具；后台 shell 是否继续。接管结束后重新观察屏幕，再继续与当前界面相关的操作，不能使用旧坐标。

routine 必须绑定伙伴与任务意图，而不是某次原生 session ID。重试应检查接受凭据与外部动作结果；未知结果不能自动当成未发生。退出条件是跨 job 重试、API 重启和电脑断连都不会产生双写或重复外部动作。

### 阶段 5：交接、远端与产品发布

先支持 idle 时的引擎切换，建立任务目标、上下文摘要、成果与检索引用。切回旧引擎时在可证明兼容条件下恢复旧 session，否则进行明确的新会话交接。

增加第二种 Computer 时才提炼跨 provider 路径与 artifact URI；不要把首个 Docker 实现的绝对路径放入公共契约。发布时逐项标明 Web、Desktop、Mobile 能做什么，某端无法回答特殊原生交互时提供正确的接手入口。

退出条件是同一长期 Bot 可以更换执行引擎或电脑而不丢产品历史，旧执行会话有明确终止或停泊记录，升级失败仍能访问成果和诊断。

## 工具、权限与共享电脑的关键冲突

当前 executor 不只是消费事件，它参与工具执行、审批重放、电脑状态和资源生命周期。这是本路线最大改造区。简单替换 `deps.runtime.run()` 会漏掉这些宿主假设。[^4]

应为每种事件明确责任：tool observation 只是观测；host tool request 才由宿主执行；permission request 回到原生会话；artifact event 只建立索引。使用同一个 event 名称但隐藏不同执行责任，会造成重复调用或权限绕行。

共享电脑也不等于共享一切。图形桌面需要交互控制权，独立工作区可以并行，浏览器 profile 和账号要有清楚归属。工作区隔离不能替代账号与外部系统的资源管理。

当前 Team Computer 为活跃 Bot 分配独立 display 与持久浏览器 profile，但它们共享容器内的系统用户和工作区，这些 profile 与目录不是互不信任进程之间的安全隔离。当前用户主动接管活跃 Team Bot 的屏幕通常要求先停止 Bot，除非运行本身已进入 waiting_takeover；不能把首版描述为用户和同一个 Bot 可无条件同时控制一个屏幕。新的原生执行路径应明确保留或调整这一产品语义。[^1]

现有 runtime cleanup 的设计是先取消、等待 iterator/工具结算，再释放所有权。新的远端控制路径应保留这个顺序，并记录无法确认退出的情况。[^5]

## 记忆、历史与产物

PostgreSQL 中的产品历史继续作为用户记录；原生 agent transcript 归其 runtime 管理。长期记忆从产品层注入，明确来源和范围；不要把完整跨月聊天每次重放给新的原生会话。

每次交接应保留可核验工作状态，工具结果和大文件通过 artifact 引用访问。原生 transcript 可以保留为诊断或检索材料，但不能把它假装成产品已控制的完整模型上下文。

产物必须带 Computer/Workspace 身份、版本或内容摘要和执行来源。远端路径到本地路径的映射不能只靠字符串替换；下载、预览和后续 agent 读取需要访问能力。

## 模块改造与成本结构

| 模块 | 保留/演进策略 | 工作量判断 |
|---|---|---|
| Bot/Thread/Computer/Routine | 保留产品对象，补 execution/native session 关系 | 中 |
| adapter-kit | 从 run 型契约扩展 session 与交互能力 | 高，决定未来维护成本 |
| PiAgentRuntime | 保留，明确宿主拥有工具/上下文 | 中，需回归现有能力 |
| executor | 分离观测、宿主执行和原生审批 | 高，不能只改调用点 |
| worker/job | 调度与运行进程分离，保留 lease 意义 | 高，涉及故障恢复 |
| Computer supervisor | 增加 agent 生命周期与通信 | 高，跨部署边界 |
| Web/Desktop/Mobile | 复用消息 UI，补能力与交互类型 | 中，需逐端验证 |

基础设施持续成本来自服务端、数据库、Computer 存活时间与日志/产物存储；模型成本来自主管、Worker 和交接。服务栈提高部署成本，却可能节省多端与常驻功能的自研成本。实际应测量冷启动、闲置电脑成本、会话复用率、主管回传轮次和重试率，不能按“用了 Pi”直接判断成本更低。

## 风险与否决信号

| 风险 | 预警信号 | 应对 |
|---|---|---|
| 原生工具被执行两次 | 一次 tool event 同时触发宿主调用与原生执行 | 明确事件责任，按请求 ID 验证执行路径 |
| worker lease 与原生进程脱节 | 旧进程活着，新 job 又启动同任务 | 执行服务持久所有权与 attach 协议 |
| ACP 成为表面封装 | 每轮新 session、全量 history 重放 | 把恢复和交互列为首个 agent 的退出门槛 |
| 多端审批不一致 | 手机只能看到文字，无法回应原生请求 | 统一交互契约，显式跨端接手 |
| 电脑接口被 Docker 细节污染 | 远端接入必须改业务模型 | Computer 标识与路径能力分离 |
| 服务负担超出目标 | 安装服务栈比核心使用更复杂 | 若本地轻量是硬要求，重新选路线 |

若为了支持两个原生引擎，必须全面重写 executor、worker、Computer 和主要 UI，同时现有伙伴功能又不是核心需求，Rakazo 的复用收益可能不足。反之，如果长期在线、多端和共享电脑很重要，这些已有能力能够抵消执行层建设成本。

## 验证与迁移

迁移采用 opt-in：新 Bot 或新任务选择新 runtime，旧 Pi 任务保持原配置；不要用一次环境变量变更把所有历史 run 切过去。新增执行记录应兼容已有 RunStatus，明确旧记录缺失 native session 时的含义。

| 验证场景 | 通过标准 |
|---|---|
| 原生 shell 与宿主 MCP 同时使用 | 每个动作只由一个执行方执行 |
| 领取 job 后、prompt 接受前断线 | 可区分未接受与未知，不盲目重发 |
| prompt 已接受后 worker 重启 | 重新 attach 或明确进入恢复态 |
| 原生审批等待时 lease 更新 | 不创建第二个 run，不丢原请求身份 |
| 用户接管电脑后恢复 | 屏幕操作重新观察，权限与运行状态一致 |
| 混合团队写同一项目 | 变更可归属、可聚合、可单独验收 |
| 手机批准已在桌面处理的请求 | 返回已处理，不再次执行 |
| 回退到旧运行时 | 历史可读，工作区保留，不强行加载不兼容 native session |

## 路线裁决

Rakazo 是“产品层复用多、执行层补建多”的路线。最先应做的技术验证是一个 session 型原生 driver 与现有 executor 的兼容，而不是先增加许多 agent 名称。

建议验证顺序为：原生/宿主工具责任分离、job 重试与持久进程、跨端原生审批。若这三项能在现有 Computer 与事件结构中自然表达，再进入多 agent 和长期切换；否则应在大规模产品改造前调整抽象。

## 来源

以下均为 Rakazo 本地快照 `b286fc4a5d0f`，不是最新线上部署声明。

[^1]: Elie222/Rakazo， [README](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/README.md)、[Computer runtime](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/docs/computer-runtime.md)，产品、部署和电脑模型。
[^2]: Rakazo， [worker 组合入口](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/apps/worker/src/index.ts#L67)、[PiAgentRuntime](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/pi-runtime.ts#L102)，当前主运行时。
[^3]: Rakazo， [AgentRuntime](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapter-kit/src/interfaces.ts#L229)、[请求与事件](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapter-kit/src/types.ts#L373)。
[^4]: Rakazo， [executor](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/executor.ts#L968)、[运行调用](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/executor.ts#L3398)、[Run 状态](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/core/src/run-state.ts)、[approval effect](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/approval-effect.ts)。
[^5]: Rakazo， [runtime cleanup](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/runtime-stream.ts)、[清理顺序测试](https://github.com/elie222/rakazo/blob/b286fc4a5d0f608005000ef35bee4c473c31a165/packages/adapters/src/runtime-stream.test.ts)。
