# 十三项目比较：加入 Todos 之后仍然没有新的可 fork 控制面

更新日期：2026-10-08。新增 Todos 桌面壳 `0.1.12` 与 `@todos-dev/cli@0.1.60`。旧对象沿用原固定快照，没有把十三个对象重新升级并做统一测试。版本见 [sources.json](../../sources.json)。

## 1. 加入 Todos 后的结论

**Todos 是完整的「托管工作台 + 本机执行器」参照，不是第十一条可 fork 底座。**官方让你安装的 runner 已经公开，而且比 Warp 公开客户端更接近真实执行面：注册、领取、worktree、十四个外部 CLI、会话镜像和完成回传都在 `@todos-dev/cli` 里。Chief、看板、派发和授权开关不在这个包里，桌面壳也明确把 `/api` 和登录留在 `todos.dev`。详见 [Todos 专题](todos-dev-analysis.zh-CN.md)。

这没有改变上一版的收敛方式。要自己拥有控制面，仍然从已有公开服务端里选，而不是从 Todos 的安装包里抽出一个服务器。Todos 把「执行器可以做得很完整，产品仍然不可 fork」这件事说得更清楚。

## 2. 总表

前十二行沿用[十二项目比较](twelve-project-comparison.zh-CN.md)。Todos 是新增行。

| 项目 | 产品起点 | 多 coding agent / ACP | 持续性重点 | 主要优点 | 面向目标的主要差距 |
|---|---|---|---|---|---|
| Kandev | 编码工作台和执行宿主 | ACP 为重要接入路径 | load、重放协调、进程与工作区 | ACP 生命周期和执行地点解耦 | 长期伙伴、知识与通用事务 |
| Cindy | 桌面伙伴 | 原生与 ACP 混合，非全 ACP | 停泊会话回切、增量上下文 | 伙伴体验与多原生交互接近目标 | 持久交接、远端边界、宿主解耦 |
| Grok Bot 重建版 | 长期伙伴 | 固定自有 loop | 产品体验参考 | 伙伴、工具和持续工作的整体组织 | 非官方重建；替换引擎需结构改造 |
| Rakazo | Bot / Computer / Routine | 主 Pi 路径，需补外部持续 runtime | Bot、电脑与例行任务 | 常驻、多端和通用伙伴模型 | 原生 session、权限责任与异构团队 |
| Agent Orchestrator | 编码监督与交付 | native Codex + ACP 等 | 编码会话监督和恢复 | 工程交付闭环 | 长期身份、记忆、非编码场景 |
| DeepSeek Harness | 可组合 agent 框架 | 外部 provider 主要一次性 | 插件、能力和日志 | 自定义底座灵活 | 完整交互式外部 Session 与产品装配 |
| Cursor Projects 恢复集 | 项目主管和成员 | 客户端材料不足以证明通用 ACP | 项目、队列、成果与介入界面 | 项目协作产品参考 | 无完整云端源码，非可直接运行底座 |
| Omnigent | 多 harness 会话平台 | SDK/native/ACP 混合 | 权限桥、会话历史、引擎切换 | 原生会话控制接近目标 | cold replay 非原生 load；伙伴与持久交接 |
| Agent Swarm | 常驻 Lead/Worker 组织 | 多 provider，ACP 每任务执行 | 持久任务、workflow 与摘要接续 | 异构组织与任务自动化 | 主动弃用 native resume；ACP 权限自动处理 |
| Memoh | 长期 Bot、电脑和知识 | direct Codex/Claude + generic ACP | 原生/重建分流、fencing 与消息提交 | 伙伴知识、执行电脑、外部权限桥 | 托管异构 Worker；有消息会话不能直接换 agent |
| Multica | Issue / Squad 工作台 | 多原生 CLI 与专用 ACP 家族 | 领取、重试、调度计划去重 | 异构团队、Daemon、多端任务交付 | 伙伴知识、原生人工审批；附加条件许可 |
| Warp Factories | 软件交付工厂 | Foreman/成员可不同 harness；ACP 仍是计划 | 专用 CLI transcript 恢复；服务端 inbox 为官方声明 | 定义即代码、异构角色、评估与改进闭环 | Oz 闭源；自托管主要执行面；通用伙伴需另建 |
| Todos | 人与 agent 共用的托管工作台 | 内置 pi，另加 14 个外部 CLI；ACP 只是其中几条传输 | 本机 worktree、会话镜像、done outbox | 执行器协议完整、机器与 UI 寿命分开 | 控制面不公开；原生审批被绕过或拒绝；不能脱离 todos.dev 自部署 |

本表是结构比较，不是性能排名。Todos 的每一格对应专题里的函数，不对应官网功能列表。

## 3. 不要混为一谈的能力

| 要解决的问题 | Todos 当前证据 | 正确的比较 |
|---|---|---|
| 主管可替换 | 客户端没有 Chief 循环。step 可以不带 `runtime`（pi）或带 14 个外部 runtime 之一 | 主管是否可替换，仍看 Agent Swarm、Multica、Warp 文档里的 Foreman。Todos 只能证明成员 runtime 可换 |
| ACP 接管 | `acpAutoReply` 拒绝 `session/request_permission`。Cursor/Gemini/Cline/DSH 等用 ACP 当单个 CLI 的 stdio | ACP load/replay 仍优先看 Kandev；把权限请求交给人，看 Memoh / Omnigent |
| 任意 agent 参与 | 团队 MCP 由执行器去连；外部 CLI 需要 git/push 时，执行器再开一个名为 `tds` 的 stdio MCP | 这是回合工具，不是编辑器反过来编排 Todos |
| 原生恢复 | pi 有 jsonl 与叶子截断；Cursor `session/load`、Codex `thread/resume`，失败则新会话。压缩只写在 pi | 不能说 14 个 runtime 都能无损续上 |
| 人工批准 | 工具名单在 step 上。各 harness 使用 bypass、yolo、approve-all，或把问人的请求拒绝。只读回合事后 `git reset --hard` | 与交互式工具审批分开。产品上的 grant 开关不在客户端 |
| 本地接手 | 桌面壳和 `tds` CLI 共用 `daemon.json`，拒绝第二个 worker。没有「从云端把锁抢到笔记本上并暂停云端」的实现 | 对照任务 claim。双 worker 被本机拒绝，不等于跨机器 fencing |
| 自托管 | 执行发生在 `tds start` 的机器上。协调、登录、看板仍是 `serverUrl`，默认 `https://todos.dev` | 与 Multica 那种公开 server 分开。有本机 daemon 不等于有可部署控制面 |
| 多 agent | 一台机器按 `maxConcurrentTasks` 并发领取多个 step，step 带自己的 conversation 与 runtime | 不是一份客户端里的 Lead/Worker 状态机 |

## 4. 对原路线的影响

| 首要目标 | 仍然优先验证 | Todos 的位置 |
|---|---|---|
| Grok 式常驻伙伴、电脑与记忆 | Memoh，并比较 Rakazo | 参照其「人只对一个入口说话、执行在别的机器」的产品形状，不拿来当伙伴内核 |
| 桌面伙伴 | Cindy | 参照壳与执行器分进程、共用注册文件 |
| 多引擎交互、权限与切换 | Omnigent / Cindy | 参照 harness 表如何按 step 切换；它的无人值守审批是反面例子 |
| 持久异构任务团队 | Agent Swarm / Multica | 产品参照。若要 fork，这两家仍有可见的任务与服务端；Todos 没有 |
| 编码监督与交付 | AO / Multica | 参照对话分支 `tds/conv-*` 与检查点回传 |
| 自主 ACP 宿主 | Kandev 机制 + 所选产品核心 | Todos 的 ACP 调用会拒绝权限请求，不能当作宿主 |
| 自定义平台 | 独立核心 / DSH 产品宿主 | 可借鉴领取、presence、outbox、worktree。控制面仍要自建 |

原十条路线保留各自版本的事实。新增的是 **第十一条：把 Todos 当参照，不把安装包当底座**。它和第十条 Warp 一样，是集成或机制借鉴，不是完整开源 fork。

## 5. 下一轮讨论应收敛什么

先回答要不要自己拥有看板和派发。若要，Todos 只提供执行器契约的对照样本：一台机器、一个 token、领取 step、独立 worktree、按 runtime 分发、完成先落盘。用 Multica、Agent Swarm 或自建控制面去实现这组契约，不要把 `todos.dev` 的接口当成可长期绑定的私有 API。

若接受托管控制面，Todos 与 Warp 是两条集成路线，比的是账号、数据能否导出、机器离线时在途任务怎么失败，而不是谁的仓库更适合 fork。这些比较都还没有在本仓库里跑过真实任务。
