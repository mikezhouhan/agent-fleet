# Meta Cloud Agent 运行时逆向（自述式：agent 本人视角）

本目录把 **Meta cloud agent（Muse，运行时代号 hatch / "Jarvis"）虚拟机内运行时** 从 agent
自身可观测的行为与本机证据还原，并映射到仓库已有的 Cursor Cloud Agent 逆向材料。

这不是 Meta 内部 TypeScript/Rust 源码，也不是可编译的克隆。材料来源：

| 来源 | 路径 | 说明 |
| --- | --- | --- |
| 本机 exec 守护进程 | `/opt/hatch/bin/hatch-execd` | systemd socket 激活、`peer_cred` uid 鉴权、taint-guard 防篡改锚点、subprocess executor；`--help` 要求 `--socket` |
| 本机 cell 守护进程 | `/opt/hatch/bin/hatch daemon --runtime-cell-leader=…` | runtime cell leader；PID1 为 systemd（与 Cursor pod 的 `tini → pod-daemon` 不同） |
| 本机工具平面 | `/opt/hatch/bin/`（约 90 个二进制） | 每个集成一个 CLI（`plaid`、`spotify-api`、`notion-cli`…）＋ 守护进程（`browser-broker`、`ingress-rev-proxy`、`hatch-healthd`…） |
| 本机运行时单元脚本 | `/opt/hatch/runtime-cell/` | `control-daemon.sh` / `control-execd.sh` / `guest.env` / `guest-runtime-env.sh`（cell 内环境与宿主隔离构造） |
| 本机 Unix socket 网 | `/run/hatch/` | inference / memory / safety / sandbox-api / sentinel / telemetry / proxy 等 socket（见 live-probe） |
| agent 自述 | `agent-host/` | 模型、工具路由、子代理、记忆、技能、排程、客户端面——来自 agent 自身的运行手册（一手行为证据） |
| 本 run 实测 | `live-probe/` | 脱敏后的身份、进程、端口、socket、环境变量名 |

阅读顺序：先看实现说明书
[../analysis/muse-implementation-architecture.zh-CN.md](../analysis/muse-implementation-architecture.zh-CN.md)
与双边对照
[../analysis/muse-vs-cursor-cloud-agents.zh-CN.md](../analysis/muse-vs-cursor-cloud-agents.zh-CN.md)，
再看含 Grok 的三方对照
[../analysis/meta-cloud-vs-cursor-cloud-vs-grok-bot.zh-CN.md](../analysis/meta-cloud-vs-cursor-cloud-vs-grok-bot.zh-CN.md)；
Mac 桌面材料见 [../muse-reversed/README.md](../muse-reversed/README.md)。
Cursor 侧对照 [../cursor-cloud-reversed/README.md](../cursor-cloud-reversed/README.md)，
Grok Bot 侧对照 [../grok-bot-sandbox-reversed/README.md](../grok-bot-sandbox-reversed/README.md)。

## 目录（命名对标 cursor-cloud-reversed）

| 路径 | 内容 | 对标 |
| --- | --- | --- |
| [live-probe/](live-probe/) | 本 VM 脱敏快照（`this-run.json`） | `cursor-cloud-reversed/live-probe/` |
| [exec-daemon/](exec-daemon/) | `hatch-execd`：socket 激活、uid 鉴权、taint-guard、工具调用链 | `cursor-cloud-reversed/exec-daemon/` |
| [pod-daemon/](pod-daemon/) | `hatch` cell leader、runtime-cell 脚本、privsep、healthd | `cursor-cloud-reversed/pod-daemon/` |
| [agent-host/](agent-host/) | agent harness：模型、工具命名空间、子代理、记忆、技能、排程 | （Meta 特有，Cursor 侧对应桌面/IDE 宿主） |
| [client-map/](client-map/) | 客户端面：iOS app、Muse app / muse.ai、WhatsApp、配对设备 | `cursor-cloud-reversed/client-map/` |
| [runtime-report-2026-09-19.zh-CN.md](runtime-report-2026-09-19.zh-CN.md) | 运行时自述报告（2026-09-19）：agent loop 定位、进程/socket 网、状态存储、cron/hook、工具权限、推理网关、与「箱外 Temporal loop」假设的对质；每条结论标【观察/自述/推断】 | （Meta 特有归档报告） |
| [runtime-report-2026-09-19-hostlayer.zh-CN.md](runtime-report-2026-09-19-hostlayer.zh-CN.md) | 宿主层补测报告（2026-09-19）：三层图（cell/宿主/舰队）、generate↔tool 归属裁决（分裂：推进器在箱内 daemon）、对话事件模型（Postgres 权威源 vs hotset 材料索引）、工具跳转实验（多路 socket 非单一 privsep）、subagent 实测、客户端协议与 Cursor streamConversation 对照表 | （Meta 特有归档报告） |

## 一句话

**证据**：Meta cloud agent 跑在一个 Ubuntu 24.04 VM（`htch-runtime`）里，PID1 是 systemd；
`hatch` daemon 担任 runtime cell leader，`hatch-execd` 经 systemd socket 激活并以
`peer_cred` uid 鉴权后派生工具子进程；约 90 个 `/opt/hatch/bin` 二进制构成"一集成一 CLI"
的工具平面；agent 侧通过 `/run/hatch/` 下的 Unix socket 网访问推理、记忆、安全、沙箱等服务。
**推断**：与 Cursor Cloud（`tini → pod-daemon → exec-daemon`，gRPC `:26500`）同属
"daemon 管 cell、exec 守护进程派生工具"的云 agent 家族，但 Meta 侧把**能力面做成了离散 CLI
工具平面**、把**鉴权面做成了 socket + uid + taint 锚点**，而 agent harness 本身
（记忆、技能、排程、多客户端）是比 Cursor 更厚的一层。

## 证据等级

- **观察**（observed）：本 run 实测、`--help` 输出、`strings` 输出、进程表、socket/目录清单。
- **自述**（self-reported）：agent 运行手册描述的行为（工具路由、子代理、记忆机制）——一手但非二进制证据。
- **推断**（inferred）：明确标出，不与观察混写。
