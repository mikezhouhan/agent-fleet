# client-map：Meta cloud agent 的客户端面

对标 `cursor-cloud-reversed/client-map/`（Cursor 侧：桌面/Glass 的
`cloudAgent*` / `localAgent*` / `cloudSubagent*` 切片）与
`grok-bot-sandbox-reversed/client-map/`（`grokbot://…` deep link）。

Meta 侧没有单一 IDE 宿主；agent 以**同一身份**出现在多个客户端，
证据来自本机 `~/docs/` 文档集（`client-surfaces.md`、`channels/`、
`calls-texts-notifications.md`）与本 run 的 runtime 字段。

## 客户端清单（文档证据）

| 客户端 | 说明 |
| --- | --- |
| iOS app | 本 run 的配对设备与消息来源（`device_id=10eaedc3-…`，`Sent from: iOS app`） |
| Muse app / muse.ai | 主聊天面；avatar 与名称展示；Secure Vault 托管页、OAuth 连接流均在此完成 |
| WhatsApp | 已接入的消息渠道（`channels/whatsapp` 文档、`channel.status` 支持 `whatsapp`） |
| Web | 浏览器内的 Muse 面（与 app 能力对等，UI 能力以 client 声明为准） |

`ui.*` 工具可在"用户正在看的 live app UI"上做轻量驱动（开视图、改设置），
能力以各客户端声明的 target 列表为准——客户端异构，agent 侧做能力探测而非假设。

## 会话模型

- **Main chat**：用户的主会话，长期存在。
- **Side chat**：按主题开的独立持久会话（`chat.create`）；有自己的标题、transcript
  与上下文。源自 side chat 的排程/提醒默认回流到同一 side chat，
  不得跨 chat 写入（除非用户明确要求 Main chat）。
- 后台 handoff（cron 结果、子代理完成、配对设备事件）以 developer 消息注入，
  agent 裁决是否打扰用户。

## 设备与通知

- 配对设备（`device.*`）：手机等用户硬件，可跑命令、拉数据（联系人、日历、短信）。
- `calls-texts-notifications.md`：电话/短信/通知的触达与语音 note 约定。
- 渠道消息（WhatsApp 等）进入 agent 时带渠道前缀（如 `[whatsapp]`），回复时不得
  给出 app 内导航指引（用户在该渠道内看不到 Muse UI）。

## 与 Cursor / Grok Bot 客户端理念的对照

| 维度 | Cursor cloud agent | Grok Bot | Meta cloud agent |
| --- | --- | --- | --- |
| 主宿主 | Cursor IDE / web（cloud agent 列表） | Grok App / X（bot 形态） | 无主宿主：iOS app、muse.ai、WhatsApp 多端同一身份 |
| 交付物 | PR / 代码 diff | 回复 / box 内产物 | 消息 + 产物（artifact/widget/附件）+ 代办事项的持续跟进 |
| 会话 | 按任务的 agent 会话 | 对话 | 长期 Main chat + 主题 Side chat，记忆跨会话 |
| 设备 | 无（云端 VM 为执行体） | box VM | 配对用户设备是**数据源**（联系人/日历/位置），VM 是执行体 |
| 触发 | 用户下发任务 | 用户 @ 或打开 | 用户消息 **+** cron/hook 主动触发 |
