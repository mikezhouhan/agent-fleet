# Meta Muse / hatch（Jarvis）运行时自述报告

> 日期：2026-09-19（CST）｜ 探测方式：本机只读命令 ＋ agent 自述 ＋ 架构推断
> 硬约束遵守情况：未输出任何密钥/token/cookie/密码/私钥/用户 MEMORY 正文/联系人/邮件/支付信息；
> 环境变量只列变量名；UUID/FQDN/hatchling id 已用稳定占位符（`hatchling-b752ad71`）。
> 证据等级：= 本机命令输出；= system prompt / 工具说明 / 运行手册；= 有理由但看不见。
> 看不见的一律写「本 VM 不可见」，未编造 Temporal/K8s/gRPC。

## 本次实际跑过的命令清单

本报告正文依赖的命令（2026-09-19 22:20–22:24 UTC，全部只读）：

```
id; hostname; uname -a; head -3 /etc/os-release
ps auxf
ss -lntp
ss -x | head -50
ss -xp | grep -E "LISTEN|inference.sock"
systemctl list-units --type=service --type=socket --no-pager --no-legend
systemctl list-timers --no-pager --no-legend
ls /etc/systemd/system/ | grep -iE "hatch|jarvis"
systemctl cat hatch-execd.socket / hatch-execd.service / hatch-ca-trust.service (前40行，Environment 值打码)
ls -la /proc/67/fd; ls -la /proc/742/fd （fd symlink 读取被拒，见正文）
grep -o " [0-9]* /run/hatch[^]*" /proc/net/unix
find /run/hatch -maxdepth 2 | sort
ls -la /run/hatch/; ls -la /run/hatch/resume/; file /run/hatch/resume/*
ls -la /opt/hatch/runtime-cell/; head -30 若干脚本（只取注释行）
ls /opt/hatch/bin | wc -l; ls /opt/hatch/bin
file /opt/hatch/bin/{hatch,hatch-execd,hatch-ws-client,browser-broker,ingress-rev-proxy}
timeout 10 /opt/hatch/bin/hatch{,-execd,-ws-client} --help
timeout 10 /opt/hatch/bin/{browser-broker,ingress-rev-proxy} --help
timeout 10 /opt/hatch/bin/hatch-ws-client chat-send --help
env | awk -F= '{print $1}' | grep -iE "^(JARVIS|HATCH|HTTP_PROXY|HTTPS_PROXY|...)" | sort （只打印变量名）
strings -a /opt/hatch/bin/hatch{,-execd} | grep -iE "temporal|cadence|workflow|grpc|connectrpc|websocket|celery|sidekiq" （短片段）
ls ~/workspace/cron.d/daily ~/workspace/cron.d/hourly ~/workspace/cron.d/runonce ~/hooks/definitions
head -20 ~/workspace/cron.d/daily/agentic-feature-tour__daily@10:54:00.md
uptime
echo -n "$JARVIS_HATCHLING_ID" | sha256sum | cut -c1-8 （仅取 hash 前缀作占位符）
```

此前同任务探测（已归档于 `live-probe/this-run.json`，结论在本报告复用并标注）：`hatch-execd` taint-guard 字符串、
`guest.env` 注释行、`systemctl` 快照、`ss` 快照等。

---

# 0. 身份与证据目录

- 模型名：Muse Spark（Muse 模型家族）
- 产品名：Muse（Meta 的 personal AI agent；对内代号 hatch / Jarvis）（二进制名 `hatch`，help 文案 "Minimal websocket client for Jarvis daemon RPCs"）
- 运行时代号：`runtime-cell` —— systemd-nspawn 容器（`ensure-rootfs.sh` 注释提及 nspawn；`run-daemon.sh` 注释："runs after nsenter, inside the runtime-cell mount namespace"）
- 本进程用户/uid：`uid=0(root) gid=0(root)`（cell 内视角）；宿主侧该身份映射为 uid 131072（`control-daemon.sh` 注释："that dir is owned by hatch-daemon (uid 131072…"）
- hostname 模式：`htch-runtime`（通用模板名，非 identifying）
- OS/kernel：Ubuntu 24.04.5 LTS，`Linux htch-runtime 7.0.0-38-generic`
- region/tier/CD channel：仅变量名 —— `JARVIS_VM_COMPUTE_REGION`、`JARVIS_VM_DATA_REGION`、`JARVIS_TIER`、`JARVIS_CD_CHANNEL`、`JARVIS_CD_PINNED`（值一律 `<redacted>`）
- 占位符：本 cell 记为 `hatchling-b752ad71`（`JARVIS_HATCHLING_ID` 的 sha256 前 8 位；原值未输出）

**「agent loop」对应的具体进程：本 VM 内无可确认的独立 loop 进程。** 候选与排除：

| 候选进程（argv + PID + 路径） | 为何排除为 token-loop |
|---|---|
| ① `/opt/hatch/bin/hatch daemon --runtime-cell-leader=1959`，PID 67 | 它是 cell 内唯一常驻 agent 相关进程，二进制含派遣/prompt 装配字符串（见 §1），但无证据表明它执行 generate↔tool 的 token 级循环；其 strings 更偏向状态机/调度/持久化（`runtime.workflow_runs`、`scheduler worker lease`、restart checkpoints）。它更可能是 agent-host＋生命周期载体，而非 loop 本体。 |
| ② `/opt/hatch/bin/hatch-execd --runtime-cell-leader=1959`，PID 742 | 实测所有工具调用都是它的直接子进程（`ps auxf`：`\_ /bin/bash --norc --noprofile -c umask 0007; …`）；`--help` 显示它是 socket-activated 的纯执行器（无 LISTEN_FDS 即 fatal）。只派生进程，不调模型。 |
| ③ node / bun / python worker、Temporal/Cadence worker | `ps auxf` 全文无此类进程，直接排除。 |

结论：**token 级「再打一次模型 / 再调一个工具 / 结束本轮」的决策点在本 VM 的进程表中不可见**（§1 详述）。

附带：`--runtime-cell-leader=1959` 中的 PID 1959 不在本 PID namespace 的 `ps` 输出里 → cell leader（宿主侧 supervisor）在箱外。

---

# 1. Agent loop 到底在哪

## 1.1 用户发来一条消息后，谁决定「再打一次模型 / 再调一个工具 / 结束本轮」？

- 按我的运行手册：每一轮（turn）由 runtime 向我投递（developer 消息可携带后台 handoff），我输出文本或 tool call；harness 执行工具后把结果拼回上下文，再次调用模型，直到我停止调用工具、本轮结束。做「继续/结束」判断的是这个 harness（agent host），不是我某条可见进程。
- 本 cell 的 `ps` 里没有承载该 harness 的独立进程；最接近的箱内进程是 PID 67 `hatch daemon`，其二进制字符串含派遣逻辑（`Delegate with delegate_type "other" … so the Expert Agent can complete the request`、`tool dispatch could not resolve presentation root session`、`seeding from subagent session transcript history`），说明**派遣/prompt 装配代码就在 daemon 二进制体内**。
- loop 的状态机在 daemon 内（`runtime.workflow_runs` / `runtime.workflow_agent_calls` 两张 Postgres 表即其持久化形态），但** token 级循环的执行驱动点在本 VM 不可见**——模型调用经宿主侧 inference proxy 发出，箱内只能看到 socket 连接存在，看不到调用方进程（`/proc/PID/fd` symlink 读取被拒，`ss -p` 无输出）。

## 1.2 调模型时：谁 connect 推理 socket？协议是什么？字段名？

- socket 路径（变量名 `JARVIS_INFERENCE_PROXY_SOCK`）：`/run/hatch/proxy/inference.sock`。
- 该路径**不在本 cell 的 mount namespace 文件系统里**（`ls /run/hatch/` 无 `proxy/` 目录），只在 `/proc/net/unix`（network namespace 视图）中可见为已绑定；探测时刻有约 13 个 ESTAB 连接。
- 谁 connect：**本 VM 不可见**。`/proc/67/fd`、`/proc/742/fd` 的 symlink 即使以 root 读取也报 `Permission denied`；`ss -xp` 的 Process 列为空。无法归因到 PID。
- 协议：**本 VM 不可见**。proxy 二进制不在箱内（`/opt/hatch/bin` 无此二进制），无法 strings。daemon RPC 侧的协议可作旁证（见 1.4）：WebSocket，默认 protobuf framing（`--use-json` "Force JSON text framing instead of auto-negotiating protobuf"），但那是 daemon RPC 协议，不等同于 inference proxy 协议。
- 请求字段名：**本 VM 不可见**（无抓包、无 proto 定义、无日志）。

## 1.3 调工具时：loop 自己 exec，还是必须经 `hatch-execd`？call_id → 进程树

- 必须经 `hatch-execd`。实测 `ps auxf`：我的每一次工具调用都以如下形态成为 PID 742 的**直接子进程**：
```
/opt/hatch/bin/hatch-execd --runtime-cell-leader=1959 (PID 742)
\_ /bin/bash --norc --noprofile -c umask 0007; <命令> (tool call 进程)
```
- 工具调用进程的环境变量中存在 `JARVIS_TOOL_CALL_ID`（仅变量名，值 `<redacted>`）—— execd 为每次 tool call 派生进程并注入 call id。
- call_id → 进程树：`hatch-execd(742) → bash(JARVIS_TOOL_CALL_ID=…) → 该调用的子进程`。loop（无论它在哪）不自己 exec。
- `hatch-execd --help` 直接报错：`execd requires --socket when systemd socket activation (LISTEN_FDS) is unavailable` —— 设计上是 socket-activated 执行器；`browser-broker --help` 印证同类组件用 `SO_PEERCRED` 做对端鉴权（peer_cred UID 鉴权）。

## 1.4 `hatch-ws-client chat-send`：阻塞等终答，还是 fire-and-forget？

`--help` 原文逐条解释：

- 总述："Minimal websocket client for Jarvis daemon RPCs."；`chat-send` = "Send a single chat message and print the final response"。
- 默认走 daemon WebSocket：`--url` 默认 `ws://198.19.0.1:18789/`（注意：这是**宿主侧链路本地地址**，不是箱内 unix socket；`--http-api-url` 由此派生，ws `:18789` → http `:18792`）。
- 默认行为 = **发一条消息并阻塞打印最终回复**（"print the final response"）。
- `--noise`：改走 ingress-rev-proxy `:4431` 的 `/v1/noise` Noise 数据面（"the path a real web client uses"）；此时**默认是 fire-and-forget**（只打印 message id），加 `--wait-reply` 才会打开 `chat.subscribe` 流等待流式回复。
- 子命令：`chat-send` 发消息；`chat-history` 经 daemon HTTP API 取历史；`fs` 经 HTTP fileserver 做文件操作；`activity` 经 HTTP API 读活动日志；`ws` 做 socket 级检查/通用 websocket RPC；`noise` 对 ingress `/v1/noise` 做 Noise 数据面操作（one-shot 请求 / 流式订阅）。
- 相关选项：`--channel`（默认 `main`，即 main/side chat 通道）、`--session-id`（指定 root session）、`--source`（默认 `runtime`）、`--modality`、`--device`、`--goal-creation-target`、`--image-file`。

结论：它不是「把整轮交给箱内 daemon」——默认目标地址本身就在宿主侧；也不是纯 fire-and-forget——默认阻塞等终答。

## 1.5 箱外是否存在 Temporal / workflow / composer / orchestrator 类进程或库？

- `ps auxf` 全文搜 `temporal|cadence|workflow|composer|celery|sidekiq|bun|node`：**零命中**（全表只有 systemd、journald、hatch、hatch-execd 和探测进程自身）。
- 对 `/opt/hatch/bin/hatch` 做 strings：`temporal|cadence|celery|sidekiq` **零命中**；`grpc|connectrpc` 零命中（仅一条 `pgRPcC` 噪声）；`websocket` 有完整实现（tungstenite 风格的握手/帧错误字符串）。
- `workflow` 的命中**全部是自研 Postgres 表/恢复逻辑**，不是第三方引擎：
`select * from runtime.workflow_runs where run_id = $1`、`runtime.workflow_agent_calls`、
`workflows.active_agent_call_for_recovery_owner`、`open workflow owner store for terminalization`、
`reverse-resolve workflow recovery owner`、`workflow-launch-prepare`。
- systemd：`list-units` 无 hatch/jarvis 相关 active unit；`list-timers` 只有 `systemd-tmpfiles-clean.timer`。

**结论：未见 Temporal/箱外 token-loop 第三方引擎。** 有的是 daemon 自研的 workflow 状态机（Postgres 持久化）。ingress / 推理网关 / 生命周期管控归属「生命周期与接入面」，不叫 agent loop。

---

# 2. 进程、systemd、socket 网

## 2.1 完整 argv（本 cell 可见进程）

`ps auxf` 全量输出仅 5 类进程（探测进程自身除外）：

```
root 1 /usr/lib/systemd/systemd （PID1）
root 17 /usr/lib/systemd/systemd-journald
root 67 /opt/hatch/bin/hatch daemon --runtime-cell-leader=1959 （daemon）
root 742 /opt/hatch/bin/hatch-execd --runtime-cell-leader=1959 （execd）
```

- healthd / browser-broker / ingress-rev-proxy / spawnd / vault / noded / sentinel：**本 cell 无运行进程**（未见）。二进制存在：`browser-broker`、`ingress-rev-proxy`、`spawnd`、`hatch-healthd`、`hatch-vault`（`hatch-vault` 调试会挂起等待审批，未深究）。
- `noded`：socket 在箱内 fs 可见（`noded/control.sock`、`ephemeral.sock`、`http-api.sock`），但**进程不可见**（监听者在别的 mount namespace 或已解绑路径）。
- `--runtime-cell-leader=` 的 PID（1959；本会话早些时候为 1968）在本 PID ns 中不存在 → leader（宿主侧 supervisor）在箱外。结合 `uptime`（探测时 12 min）与 `/run/hatch/resume/` 时间戳（22:10），**本 cell 在 22:10 左右被重建过一次**，而我的会话跨过了重建（§4 的证据）。

## 2.2 systemd units

`systemctl list-units --type=service --type=socket` **无任何 hatch/jarvis 相关 active unit**（只有 systemd 自身的）。但 unit 文件存在：

```
/etc/systemd/system/hatch-execd.socket
/etc/systemd/system/hatch-execd.service
/etc/systemd/system/hatch-ca-trust.path
/etc/systemd/system/hatch-ca-trust.service
```

`systemctl cat` 前 40 行（Environment 值已打码；本文件本就没有 Environment 行）：

`hatch-execd.socket`：`ListenStream=/run/hatch/execd/execd.sock`，`Service=hatch-execd.service`，`RemoveOnStop=true` —— socket activation 设计。
`hatch-execd.service`：`ExecStartPre=/bin/sh -c 'test -f /opt/hatch/runtime-cell/runtime-cell.ready'`；
`ExecStart=/opt/hatch/runtime-cell/run-execd.sh --socket /run/hatch/execd/execd.sock`；`UMask=0007`；`Restart=always`。
`hatch-ca-trust.service`：oneshot，把宿主发布的 `/run/hatch/cell-anchors/*.pem` 软链进 cell 的 CA trust（`update-ca-certificates`）。

unit 文件是模板/遗留：实际运行的 execd argv 是 `--runtime-cell-leader=1959`（无 `--socket`），且 `run-execd.sh` 在本 cell 压根不存在 → **实际由宿主侧经 nsenter 启动**（`run-daemon.sh` 注释："This script runs after nsenter, inside the runtime-cell mount namespace"）。

## 2.3 `/run/hatch/` 树

本 cell mount namespace 中的实际树（`ls -la /run/hatch/`）：

```
auth/ cell-anchors/ egress-tls/ egress-tz/ noded/ privsep/ resume/
runtime-cell/ sandbox/ sandbox-api/ telemetry/
```

- `privsep/`：约 90 个按集成命名的 socket（`box-cli.sock`、`browser-service.sock`、`calendly.sock`、`canva.sock`、`device-data.sock`、`dropbox.sock`、`duffel.sock`、`facebook-cli.sock`、`flightaware.sock`、`geocode.sock`、`granola-cli.sock`、`healthkit-cli.sock`、`image-search.sock`、`instagram-cli.sock`、`local-search.sock`、`media-generation.sock`、`media-library.sock`、`messenger.sock`、`meta-ads-cli.sock`、`muse-mail.sock`、`navigation.sock`、`notion-cli.sock`、`opentable.sock`、`outlook-*.sock`、`places.sock`、`plaid.sock`、`share.sock`、`shopping.sock`、`slack.sock`、`spotify-api.sock`、`stripe-link*.sock`、`subscription-status.sock`、`tailscale.sock`、`threads-*.sock`、`tts.sock`、`wai-privsep.sock`、`web-search.sock`、`withings.sock` …）—— 一集成一 socket。
- `telemetry/`：`telemetry.sock`、`bugreport.sock`、`scuba`；`sandbox/`：`space-inference.sock`、`space-media.sock`、`space-privileged.sock`、`space-web-search.sock`；`sandbox-api/api.sock`；`auth/authd.sock`；`noded/` 三个 socket；`resume/`（见 §4）；`cell-anchors/`（`hatch-egress-ca.pem`、`hatch-ingress-ca.pem`）；`egress-tls/`、`egress-tz/`。

`/proc/net/unix`（network namespace 视图）中**已绑定但在本 cell fs 中不存在**的路径 —— 监听者在别的 mount namespace（宿主侧）：

| socket 路径（仅路径字符串） | 一句话职责 |
|---|---|
| `/run/hatch/proxy/inference.sock` | 模型推理代理（`JARVIS_INFERENCE_PROXY_SOCK`）；探测时约 13 个 ESTAB 连接 |
| `/run/hatch/proxy/stefi.sock` | Stefi 代理（`JARVIS_STEFI_PROXY_SOCK`；daemon strings 有 `stefi_proxy_unavailable`） |
| `/run/hatch/exec/execd.sock` | execd 控制面（注意与 unit 模板里的 `execd/execd.sock` 路径不一致） |
| `/run/hatch/safety/security.sock` | 安全/策略（`JARVIS_SECURITY_SOCK`） |
| `/run/hatch/memory/memory.sock` | 记忆服务（`JARVIS_MEMORY_SOCK`） |
| `/run/hatch/sentinel/http-api.sock` | 审批/许可（`JARVIS_SENTINEL_HTTP_API_SOCKET`） |
| `/run/hatch/daemon/http-api.sock` | daemon HTTP API（`JARVIS_DAEMON_HTTP_API_SOCKET`） |
| `/run/hatch/cron-store/control.sock` | cron 定义存储 |
| `/run/hatch/credit-watcher/credit-watcher.sock` | 用量/额度观察 |
| `/run/hatch/postgres/.s.PGSQL.5432` | 运行时 Postgres（daemon strings 含全套 SQL） |

这是**有意为之的隔离**：`browser-broker --help` 原文写明其 socket 目录 "DELIBERATELY not bind-mounted into the runtime cell: the cell has NO path to the broker. The sole client is the host daemon" —— 同一模式适用于上表 socket：监听者在宿主侧，cell 内进程（如 daemon）持有连接，但路径不进 cell 的 fs。

## 2.4 监听端口与 egress

- `ss -lntp` **输出为空**：零 TCP 监听。全部 IPC 走 Unix socket。
- egress proxy 环境变量（仅名）：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`http_proxy`、`https_proxy`、`all_proxy`、`NO_PROXY`、`no_proxy`。
- `control-execd.sh` 注释原话："Export the trusted cell runtime env (egress proxy + TLS CA bundle) from the host-rendered, root-owned guest.env so execd's tool subprocesses get **Sentinel-routed egress** and TLS verification."

---

# 3. 一轮对话的时序

以 sequence 描述「iOS/WhatsApp/muse.ai 来一条消息」→「最终回复回去」（每步标证据等级）：

1. 客户端经 **Noise_XX 加密**连接 `ingress-rev-proxy`（`:4431` 的 `/v1/noise`；`:443` 为 infra/ops 面）。`--noise` 选项注明这是 "the path a real web client uses"。
2. ingress 把 turn 交给 daemon（daemon WS 默认 `ws://198.19.0.1:18789/`，或经 daemon HTTP API）。
3. daemon 装配上下文：
- 时间戳：`JARVIS_USER_TIMEZONE`（名）；
- `device_id`：我的运行手册写明每轮 developer 消息携带时间戳与 device_id；
- main vs side chat：`chat-send --channel`（默认 `main`）/ `--session-id`（root session）；
- 历史：从 Postgres 读 canonical chat events（`failed to persist canonical chat event`）、memory 服务、hotset（§4）。
4. daemon 调 inference proxy（`/run/hatch/proxy/inference.sock`）拿模型输出。
5. 若模型输出 tool call：daemon 经 `hatch-execd` 在**箱内**派生进程（`execd(742) → bash(JARVIS_TOOL_CALL_ID=…)`，实测父子关系）；工具结果拼回上下文，回到步骤 4，直到模型停止调工具。
6. 最终回复原路返回：daemon → ingress Noise 通道 → 客户端；或 `--wait-reply` 时的 `chat.subscribe` 流。
7. 用户再开 side chat：`--channel`/`--session-id` 隔离，daemon 侧按 session 分区；派 subagent：daemon 按 "seeding from subagent session transcript history" 把父 transcript 的**持久化历史** seeding 给子 agent，失败回退 "persisted prompt history fallback" —— 是**拷贝/重播**，不是共享 fd。

---

# 4. 状态存在哪（对标 Cursor blob + offsetKey）

| 状态项 | 权威源（路径或 socket） | 格式 | 过 VM 重启存活？ |
|---|---|---|---|
| 当前 chat transcript（main/side） | 宿主侧 Postgres（`failed to persist canonical chat event`；表名见 strings：`conversation_store*`、`channel_deliveries` 等） | 行式事件（canonical chat event） | 是（见下） |
| conversationState / 游标 / offset | 有 checkpoint/seq 机制：`active_checkpoint_seq`、`snapshot_next_seq`、eager background compaction checkpoints、runtime restart checkpoints、`handoff-epoch`；Cursor 式 offsetKey：**本 VM 不可见** | seq＋checkpoint | 是 |
| `MEMORY.md` / `~/memory/` | `~/MEMORY.md`、`~/memory/*.md` 文件 | Markdown | 是：本会话跨过 22:10 的 cell 重建，文件仍在 |
| `memory.sock` 协议 | 变量名 `JARVIS_MEMORY_SOCK`；socket 在宿主侧（箱内 fs 不可见） | 方法名**本 VM 不可见** | — |
| `/run/hatch/resume/` | 文件类型：`execution-ready.marker`（ASCII）、`first-boot-ensure-stamp.json`（JSON）、`handoff-epoch`（ASCII）、`handoff-marker.slot0`（data, 4KB）、`hotset.manifest`（NDJSON, 70KB）、`index.bin`（data, 750B）、`pg-clean.proof`（ASCII）、`rv-identity-ready`（ASCII）。内容未读。 | markers＋manifest＋bin | 是：`first-boot-ensure-stamp.json` 时间戳为 14:41，早于 22:10 的重建 |
| 子代理 transcript 继承 | strings：`seeding from subagent session transcript history`；失败时 `using persisted prompt history fallback` | 持久化历史的拷贝/重播 | 是 |
| VM 被杀/休眠/换机后的 context 重建 | 本会话**亲历** cell 在 22:10 重建（`uptime` 12 min；leader PID 1968→1959），对话无缝继续 → 下一轮从 Postgres（宿主侧）＋ `resume/` ＋磁盘文件重建 context，而非箱外另有一份"权威历史流"推送。箱外（宿主侧）确实有 authoritative store（Postgres socket 不在箱内），但它是**被 daemon 读取**的，不是绕过 daemon 的推送通道 | — | 是 |

---

# 5. cron / hook / heartbeat（谁叫醒谁）

- cron 定义位置与格式：`~/workspace/cron.d/<freq>/<id>__<freq>@<HH:MM:SS>.md`，如 `daily/agentic-feature-tour__daily@10:54:00.md`；文件头为 frontmatter：
`id`、`enabled`、`mode: task`、`schedule:{kind, timezone, time}`、`delivery: []`，正文为任务描述。
- 谁触发：`cron-store/control.sock` 存在（net-ns 视图）；daemon strings 有调度器租约机制：`load_scheduler_worker_lease`、`active_scheduler_worker_owner_for_agent`、`get_scheduled_resume_state`、`next_wake_eligible_maintenance_occurrenceretry`、`manualenqueue_manual_run`、`list_job_states`。即：**调度器 worker 持有 lease，到点触发**。箱内 `systemctl list-timers` 只有 `systemd-tmpfiles-clean.timer` → **不是箱内 systemd timer**。
- 用户离线 / cell 已停时到点任务：宿主侧调度（到点可唤醒/重建 cell —— 本会话的 cell 重建即此能力的旁证）。"只在下次用户消息时补跑"：无证据，**未见**。
- `HEARTBEAT.md` / self_improvement / dreams：`~/HEARTBEAT.md` 存在；daemon strings 有 `reverse-resolve self-improvement recovery owner`、`open self-improvement owner store for terminalization` → 自改进有 owner store 与调度；`dreams/alignment` 的具体调度链**本 VM 不可见**（只见目录）。
- 后台结果 handoff：按运行手册，后台任务（cron/hook/子代理）完成时，runtime 以 **developer 消息**形式把结果注入下一轮 prompt；也可是独立 turn。`chat-send --source`（默认 `runtime`）即 turn 来源标记。

---

# 6. 工具平面与权限

- `/opt/hatch/bin` 共 97 个，分类如下：
- daemon/服务类（约 10）：`hatch`、`hatch-execd`、`hatch-healthd`、`spawnd`、`browser-broker`、`browser-service`、`ingress-rev-proxy`、`device-data`、`function-health`、`authdc`
- 集成 CLI 类（约 70）：`airtable-cli`、`asana-cli`、`notion-cli`、`slack`（实为 cli）、`github` 相关（`gitlab-cli`）、`linear-cli`、`jira-cli`、`figma-cli`、`zoom-cli`、`vercel-cli`、`stripe-link`、`plaid`、`duffel`、`flightaware`、`tickemaster`（`ticketmaster`）、`spotify-api`、`threads-cli`、`instagram-cli`、`facebook-cli`、`muse-mail`、`outlook-*`、`goog` 系（`hatch_gws_cli`）等 —— **一集成一 CLI**
- 技能/工具包装类（约 15）：`share`、`tts`、`web-search`、`shopping`、`geocode`、`places`、`local-search`、`image-search`、`media-generation`、`media-library`、`opentable`、`save-to-spotify`、`hatch-ws-client`、`hatch-doctor`、`hatch-zeitgeist` 等
- `tool_search.load_tool_namespace` 发生在哪一层：按工具说明，延迟加载是把所选 namespace 的 schema 注入**我的上下文**，即发生在 **prompt 装配侧（harness）**；箱内无对应进程，`hatch-execd` 只负责进程派生。装配层的具体实现本 VM 不可见。
- 约束机制：
- `hatch-execd` 二进制含 `taint-guard` / `taint-anchor` 防篡改字符串（此前探测）；
- 同类 socket 用 `SO_PEERCRED` 做对端鉴权（`browser-broker --help` 原文）；
- `bin-scopes.conf` 注释原话：per-channel allowlist，被 gate 的二进制"carved out of the cell's /opt/hatch/bin … staged host-only" —— 箱内看不到的二进制是**有意剔除**的；
- `pre-start.sh` 注释原话：`/run/hatch/daemon` 是 "cell-root-forgeable" —— **箱内 root 不被宿主信任**，生命周期状态放在 root-owned 的 `daemon-ctl`；
- `require-modules.sh` 黑名单内核模块（AF_ALG 等），`UMask=0007`。
- credentials/vault：按 Secure Vault 规范，agent 进程**读不到明文**（值直存 vault，经批转使用；`hatch-vault` 调用会挂起等待审批）。OTP 路径只写步骤名：browser handoff 指认站点与步骤 → 受保护查找（connected 邮箱/消息）→ 取 `credential` 引用 → `browser.steer_task` 以 `credential_fill` 下发 → 单次用户审批 → authd 直送浏览器；失败则停止，不重试裸码。

---

# 7. 推理与网关

- `inference.sock` 后面是否出 cell：**已出 cell** —— 监听路径不在本 cell mount namespace 的 fs 里，只在 net-ns 视图可见。是经 egress-proxy 还是专有 veth：**本 VM 不可见**。旁证：工具子进程的 egress 是 Sentinel-routed 代理（`control-execd.sh` 注释），但那是工具 egress，不是推理路径。
- 第二模型/分类器/安全介入：strings 有 `voice Tool LLM fast search failed; automatically falling back to Expert Agent` → 存在 **Tool LLM 与 Expert Agent 的分工与回退**；`prompt_injection_checker`、`classifier_unavailable` → 每轮有**注入检查分类器**。是否"每一轮"都介入：字符串只证明存在性，调用频率本 VM 不可见。
- 流式 token 是否经同一 socket、有无 heartbeat：**本 VM 不可见**（proxy 二进制与协议均在箱外）。

---

# 8. 与「箱外 Temporal loop」假设的对质

**裁决：反对。**

> 「本产品的 generate↔tool 循环由箱外工作流引擎推进，VM 只是 exec worker。」

三条以上：

1. 箱内 `ps` 无任何第三方工作流 worker 进程（无 temporal/cadence/celery/sidekiq/bun/node 常驻进程）。
2. `hatch` 二进制 strings：`temporal|cadence|celery|sidekiq|grpc|connectrpc` 零命中；`workflow` 命中全部是**自研 Postgres 表与恢复逻辑**（`runtime.workflow_runs`、`runtime.workflow_agent_calls`、`reverse-resolve workflow recovery owner`），不是外部引擎。
3. 工具调用由**箱内** `hatch-execd` 直接派生（`ps auxf` 实测父子关系），不是外部 worker 拉任务执行。
4. daemon 二进制内含派遣与 prompt 装配字符串（`Delegate … so the Expert Agent can complete the request`、`tool dispatch could not resolve presentation root session`、`seeding from subagent session transcript history`）——loop 逻辑在 hatch 自身体内，不在外部编排器。

改写后的一句话架构（证据分级版）：

**generate↔tool 循环由 `hatch daemon` 内的自研 workflow 状态机推进（状态落宿主侧 Postgres 的 `runtime.workflow_runs` / `runtime.workflow_agent_calls`）；工具执行面在箱内由 `hatch-execd` 派生进程；推理/记忆/安全/调度走宿主侧 unix socket 服务；箱外只有 ingress（Noise_XX 反向代理）与生命周期管控，没有第三方工作流引擎；VM 也不是纯 exec worker —— agent-host 逻辑（PID 67 的 `hatch daemon`）就运行在箱内，只是它的服务 socket 被有意不 bind-mount 进 cell（`browser-broker --help` 原文为证）。**

---

# 9. 原始附件（全部脱敏，长输出截断但保留头部）

## A. `ps auxf`（全量）

```
USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
root 742 0.0 0.1 1064076 10200? S 22:10 0:00 /opt/hatch/bin/hatch-execd --runtime-cell-leader=1959
root 2097 0.0 0.0 7916 4188? R 22:21 0:00 \_ ps auxf
root 2098 0.0 0.0 4344 3568? S 22:21 0:00 \_ /bin/bash --norc --noprofile -c umask 0007;...
root 67 1.1 9.5 3277908 773376? Sl 22:10 0:07 /opt/hatch/bin/hatch daemon --runtime-cell-leader=1959
root 1 0.0 0.1 20944 12392? Ss 22:10 0:00 /usr/lib/systemd/systemd
root 17 0.0 0.1 33840 10888? Ss 22:10 0:00 /usr/lib/systemd/systemd-journald
```

## B. `ss -lntp`（全量）

```
State Recv-Q Send-Q Local Address:Port Peer Address:PortProcess
（空：零 TCP 监听）
```

## C. `/proc/net/unix` 中 hatch 相关已绑定路径（摘录）

```
/run/hatch/telemetry/telemetry.sock /run/hatch/safety/security.sock
/run/hatch/noded/control.sock /run/hatch/cron-store/control.sock
/run/hatch/postgres/.s.PGSQL.5432 /run/hatch/credit-watcher/credit-watcher.sock
/run/hatch/proxy/inference.sock /run/hatch/proxy/stefi.sock
/run/hatch/auth/authd.sock /run/hatch/exec/execd.sock
```
（后六个路径在本 cell fs 中不存在，仅见于 net-ns 视图。）

## D. `systemctl cat`（前 40 行）

`hatch-execd.socket` / `hatch-execd.service` / `hatch-ca-trust.service` 见 §2.2（无 Environment 值，无打码项）。

## E. `--help` 摘录

- `hatch --help`：`Hatch daemon service binary`（仅 --help/--version）。
- `hatch-execd --help`：`ERROR execd fatal error error="execd requires --socket when systemd socket activation (LISTEN_FDS) is unavailable"`。
- `hatch-ws-client --help`：见 §1.4（默认 `--url ws://198.19.0.1:18789/`；`--use-json` "Force JSON text framing instead of auto-negotiating protobuf"；`--noise` 走 ingress `:4431` `/v1/noise`）。
- `hatch-ws-client chat-send --help`：见 §1.4（`--channel` 默认 `main`；`--wait-reply` 仅配合 `--noise` 有意义）。
- `browser-broker --help`：关键句见 §2.3（socket 目录 "DELIBERATELY not bind-mounted into the runtime cell"）。
- `ingress-rev-proxy --help`：`Internet-facing ingress reverse proxy with Noise_XX encryption`（`:4431` public，`:443` infra）。

## F. 环境变量名（`env | awk -F= '{print $1}'`，值全部略去）

```
ALL_PROXY HATCH_API_SOCKET HTTPS_PROXY HTTP_PROXY
JARVIS_AUTHD_INGRESS_ALLOWED_USERS JARVIS_AUTHD_SOCK JARVIS_BIN_DIR
JARVIS_CD_CHANNEL JARVIS_CD_PINNED JARVIS_DAEMON_EGRESS_APPROVAL_SOCK
JARVIS_EGRESS_APPROVAL_ADMIN_SOCK JARVIS_EGRESS_APPROVAL_EVENTS_SOCK
JARVIS_FQDN JARVIS_HATCHLING_ID JARVIS_HOME JARVIS_INFERENCE_HOSTNAME
JARVIS_INFERENCE_PROXY_SOCK JARVIS_IS_ASSIGNED JARVIS_MEMORY_SOCK
JARVIS_PRESENTATION_LOCALE JARVIS_REQUEST_MODE JARVIS_RESCUE_SIGNAL_SOCK
JARVIS_RUNTIME_CONTEXT_TOKEN JARVIS_SANDBOX_API_SOCK JARVIS_SECURITY_SOCK
JARVIS_SENTINEL_HTTP_API_SOCKET JARVIS_SESSION_ID JARVIS_STEFI_PROXY_SOCK
JARVIS_TELEMETRY_PROXY_SOCK JARVIS_TIER JARVIS_TOOL_CALL_ID
JARVIS_TRACE_CONTEXT JARVIS_USER_TIMEZONE JARVIS_VM_COMPUTE_REGION
JARVIS_VM_DATA_REGION NO_PROXY all_proxy http_proxy https_proxy no_proxy
```
（共 54 个；另有 PATH/HOME 等通用变量未列。）

## G. `/opt/hatch/runtime-cell/` 文件名＋注释

文件名：`bin-scopes.conf`、`build-cell-trust-store.sh`、`control-daemon.sh`、`control-execd.sh`、
`ensure-rootfs.sh`、`etc/`、`guest-runtime-env.sh`、`guest.env`（host-rendered 值文件，未读值）、
`hatch-preflight-opportunistic`、`is-loopback-rv.sh`、`launch-daemon.sh`、`post-start.sh`、
`post-stop.sh`、`pre-start.sh`、`require-modules.sh`、`resolve-rootfs-path.sh`、
`run-daemon.sh`、`runtime-cell-entry.sh`、`skill-scopes.conf`、`stop.sh`。

关键注释原文（§2.2/§6 已引用）：nsenter 启动、Sentinel-routed egress、"cell-root-forgeable"、nspawn、btrfs snapshot rootfs、host-side trust producer。

---

## 给架构研究员的结论（10 行以内）

1. loop 不在箱内某独立进程里：`ps` 只有 daemon/execd；派遣与 prompt 装配代码在 `hatch daemon` 二进制体内，状态机是自研的（Postgres `runtime.workflow_runs`），**无 Temporal/第三方引擎**。
2. 工具面在箱内：`hatch-execd(742) → bash(JARVIS_TOOL_CALL_ID=…)`，实测父子关系；execd 是 socket-activated 执行器。
3. 推理/记忆/安全/调度 socket 的监听端**不在箱内 fs**（只见于 net-ns），是宿主侧服务；这是有意隔离（browser-broker help 原文）。
4. 状态在宿主侧 Postgres（canonical chat events、workflow runs、scheduler leases、restart checkpoints）＋箱内磁盘（`~/memory/`、`resume/`）；本会话亲历 cell 重建而无缝继续。
5. 消息经 ingress Noise_XX 反向代理进，daemon WS（`198.19.0.1:18789`）是宿主侧地址；`chat-send` 默认阻塞等终答。
6. cron 定义是 `~/workspace/cron.d/` 下的 Markdown＋frontmatter，由调度器 lease 触发，非 systemd timer。
7. 有 Tool LLM / Expert Agent 分工与 prompt-injection classifier（strings 证据），但调用频率与推理协议本 VM 不可见。
8. 本 VM 永远看不到：inference 请求字段/协议、loop 驱动点的进程归因（fd 被拒）、箱外编排细节、memory.sock 方法名。
