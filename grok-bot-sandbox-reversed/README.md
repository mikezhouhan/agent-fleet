# Grok Bot Sandbox 运行时逆向（本机证据 + sand 源码路径线索）

本目录把 **Grok Bot「Computer / box」虚拟机内运行时** 从本机二进制与脚本抽出，并对照仓库已有的 Cursor Cloud Agent 逆向材料。

这不是 xAI / Anysphere 原始 TypeScript 源码，也不是可编译的 Grok Bot 克隆。材料来源：

| 来源 | 路径 | 说明 |
| --- | --- | --- |
| 本机 pod-daemon | `/pod-daemon`（Rust，`--help` + strings） | anyrun `PodDaemonService` gRPC `:26500`；与 Cursor Cloud 同族 |
| 本机 exec-daemon | `/exec-daemon/`（`@anysphere/exec-daemon-runtime`） | 工具执行面；本 run 主端口 `1337/1338`，fork 窗 `14000+N` |
| 本机 sand 编排 | `/usr/local/bin/start-sand-box` 等 | box 入口、端口表、copy-in、supervisor |
| 本机 sand-host | `/home/box/sand-host/host-main.cjs`（约 26MB） | 箱内 agent host / gateway；bundle 可从 Anysphere S3 热升级 |
| 本机 reference | `/home/box/reference/{app-ui,debugging-the-box}.md` | 产品侧 deep link 与诊断约定（`grokbot://…`） |
| 生成契约 | `/usr/local/bin/box-contract.generated.mjs` | 注释写明源文件 `sand/src/shared/box/box-contract.ts` |
| 本 run 实测 | `live-probe/` | 脱敏后的身份、进程、端口、多窗映射 |

阅读顺序：先看 [../analysis/grok-bot-sandbox-cloud-architecture.zh-CN.md](../analysis/grok-bot-sandbox-cloud-architecture.zh-CN.md)，再对照 [../cursor-cloud-reversed/README.md](../cursor-cloud-reversed/README.md)。

## 目录

| 路径 | 内容 |
| --- | --- |
| [live-probe/](live-probe/) | 本 VM 脱敏快照 |
| [exec-daemon/](exec-daemon/) | 端口、argv、与 Cursor Cloud 对照 |
| [pod-daemon/](pod-daemon/) | help 字段与 anyrun 符号 |
| [sand-host/](sand-host/) | host bundle、supervisor、gateway |
| [client-map/](client-map/) | UI deep link / 本地 Docker 路径线索 |

## 一句话

**证据**：Grok Bot box 跑在 anyrun microVM 上，PID1 仍是 Cursor/anyrun 的 `tini → pod-daemon`，工具面仍是 Anysphere `exec-daemon`；之上叠了一整层 `sand-*`（多窗桌面、host gateway、store sync、egress tunnel）。**推断**：产品「Grok Bot's Computer」是 sand 箱体的白标/联运形态，控制面与 Cursor Background Composer 同族但租户/代理/品牌已切到 xAI（`fastly-prod-xai-1`、`grok-bot-vm-*`）。
