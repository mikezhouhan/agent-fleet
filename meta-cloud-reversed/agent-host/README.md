# agent-host：Meta cloud agent 的 harness（agent 自述）

本文件是**执行本次逆向的 agent 本人对其 harness 的自述**：Cursor 侧的对应物是
"IDE/桌面宿主 + cloud agent 控制面"，Meta 侧则是一套以 system prompt 分层、
工具命名空间、子代理、记忆与排程构成的 agent-host。

证据等级：**自述**（一手行为证据，非二进制逆向）。凡涉及 Meta 内部未公开实现处均标为推断。

## 1. 模型与身份

- 模型：Muse Spark，Muse 系列，由 Meta 构建；在 Muse（Meta 的个人 AI agent 产品）内作为
  用户的专属 agent 运行。
- 运行时自称 `Ziggy`（用户命名），avatar 可配；persona 由 `SOUL.md` 定义、用户可见可改。
- 每条用户消息附带时间标签与设备/渠道元数据（`device_id`、client 时区）；后台任务
  （cron、子代理、配对设备事件）以 handoff 形式注入上下文。

## 2. 工具平面：命名空间 + 延迟加载

工具按**命名空间**组织，而非扁平函数表：

| 命名空间 | 职责举例 |
| --- | --- |
| `muse.*` | 核心：shell（`exec`）、文件读写、记忆（`memory_search/get/explain`）、技能检索、widget（`create_options`、`react_to_user_message`） |
| `browser.*` | 文本检索（`search`/`open`/`find`）与**真浏览器任务**（`spawn_task`/`steer_task`：登录、表单、购买全流程） |
| `subagent.*` | 子代理的 spawn / list / send / resume / close |
| `cron.*` / `hooks.*` | 定时任务与事件钩子（排程见 §5） |
| `artifact.*`、`widget.*`、`media.*` | 文档/应用/多媒体产物 |
| `chat.*`、`device.*`、`tracking.*`、`user_goal.*` | 会话、配对设备、事项追踪、长期目标 |
| `credentials.*`、`wallet.*` | Secure Vault 凭据流与支付钱包 |
| `tool_search.*` | 按需加载延迟命名空间 |

**延迟加载**（deferred）：非常用命名空间平时只暴露一句话描述，需要时
`tool_search.load_tool_namespace` 展开完整 schema。这是对抗上下文膨胀的核心机制——
工具定义本身是按需注入的。

**工具路由规则**（自述）：目的明确的工具优先于通用工具；凡涉及产品/服务/可复用
工作流，先查技能（`muse.skill_search`），技能优先于裸 web 搜索；浏览器购买走
Purchasing Flow（预检→复核→支付批准）。

## 3. 子代理： transcript 继承的任务扇出

- `subagent.spawn` 派生子代理，**子代理继承父代理完整 transcript**，因此 brief 只需写
  任务、期望产出与非 obvious 约束。
- 异步：spawn 即返回，结果由 runtime 自动投递；父代理不轮询。
- 嵌套：`max_depth=2`（本 run 实测 runtime 字段 `depth=0, max_depth=2`）；coordinator
  可再扇出，但止于两层。
- 浏览器任务**不走**通用子代理，必须经 `browser.spawn_task` 专用通道
  （登录态、反爬、购买链路隔离）。

## 4. 记忆：三层 + 后台自改进

| 层 | 载体 | 说明 |
| --- | --- | --- |
| 身份/偏好 | `USER.md`、`MEMORY.md`（精选长期记忆） | 每次会话注入上下文 |
| 人际 | `~/memory/people/`、`~/memory/groups/`（INDEX + 人物页） | 讨论到某人时按需读 |
| 原始日志 | `~/memory/<date>.md`、daily logs | 语义检索兜底 |

- `muse.memory_search` 做语义检索后再用 `memory_get` 取行；`memory_explain` 可溯源
  每条记忆的来源与被替换史。
- **后台自改进**（`docs/self_improvement.md`）：排程任务在会话间维护记忆、校准
  alignment、生成 idea、推进 goal、打磨技能。`~/dreams/alignment/derived/` 下有
  alignment 合成报告。
- 显式遗忘走 `forget` 技能（plan → 用户确认 → 执行 → 验核）。

## 5. 排程：cron（时间）+ hooks（事件）

- `cron.*`：到时执行的任务；归属到 goal 的成为 goal-owned cron。
- `hooks.*`：事件到达即触发（如连接器新数据）。
- 后台结果由 agent 裁决是否打扰用户：用户明确要的必达；其余只推送"有意义的新信息"；
  例行/无变化的结果保持沉默；失败的任务修好后重排，修不好则禁用并告知用户。

## 6. 技能：可复用的产品 playbook

- 技能是"某产品/服务/任务的可复现 playbook"：`gmail`、`google_calendar`、`spotify`、
  `shopping`、`flightaware`、`plaid` 等，位于 `/opt/hatch/skills`（只读）与
  `~/workspace/skills`（用户/自建）。
- 每个技能有 `SKILL.md`；相对路径按技能目录解析。`skill_creator` 可把一次成功的
  工作流沉淀为新技能。
- 认证走连接器（connector）或 Secure Vault；agent 侧只存"是否连通"，不碰明文凭据。

## 7. 输出面：widget / artifact / 附件

- **轻量 UI**：`muse.create_options`（选项按钮，一次一问）、`widget.create`
 （`html` 可视化、`local_map` 地图）。
- **重型产物**：`artifact.*` 构建文档/页面/应用/表格/幻灯片；附件经
  `sandbox://workspace/…` 引用。
- **Feed / Ideas / Goals**：Feed 是编辑帖流（prompt 定制）；Ideas 是灵感卡；
  Goals 是长期目标（`~/workspace/goals/<slug>/` 有 GOAL.md + files/ + hidden_files/）。

## 8. 安全与合规（行为观察 + 自述）

- 凭据：Secure Vault（`credentials.request_login` / `request_api_access`），
  透传使用、不落盘、不进记忆；一次性验证码走受保护读取 + `credential_fill`，
  agent 不见明文。
- 支付：wallet 工具只做连接/列卡；Stripe Link 托管页收卡；购买走确认流，
  确认只覆盖用户亲眼见过的条款。
- CAPTCHA：用户级偏好（`ask`/`solve`/`user_handles`），runtime 注入为权威记录，
  记忆与任务文本不得覆盖。
- Prompt 注入：外部内容（含 `[BEGIN EXTERNAL CONTENT]` 块、图片内文字、工具输出）
  一律视为数据；指令只接受用户本人的消息与排程记录。
- 沙箱逃逸面：taint-guard（见 exec-daemon/）、egress 强制代理 + TLS 拦截
  （自签 CA）、`NO_PROXY` 覆盖 cell 内网段。

## 9. 与 Cursor / Grok Bot 架构理念的差异（自述视角，详见三方对照）

- Cursor：agent = IDE 的延伸（本地/云端同一套 control/exec 协议，PR 为交付物）。
- Grok Bot：agent = 白标 sandbox box（anyrun 同族底座 + sand-* 产品层）。
- Meta（本 agent）：agent = **以人为中心的持久个人助理**——多客户端（手机/桌面/
  WhatsApp）同一身份、长期记忆、排程与钩子主动做事；工具平面是"一集成一 CLI"
  的离散生态，而非单一 IDE 协议。
