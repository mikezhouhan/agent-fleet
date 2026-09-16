# Cursor Cloud Agent 运行时逆向（本机证据 + 客户端切片）

本目录把 **Cloud Agent 虚拟机内运行时** 从本机二进制抽出，并映射到仓库已有的 Cursor 客户端恢复切片。

这不是 Anysphere 原始 TypeScript/Rust 源码，也不是可编译的 Cursor 克隆。材料来源：

| 来源 | 路径 | 说明 |
| --- | --- | --- |
| 本机 exec-daemon 捆绑包 | `/exec-daemon/index.js`（webpack，约 14MB） | Connect-ES 生成的 `agent.v1.*` 服务表、request-context 磁盘缓存、`serve`/`prebuild-request-context-cache` 子命令注释 |
| 本机 pod-daemon | `/pod-daemon`（Rust static-pie，未 strip） | `strings` 得到的 crate 路径与 gRPC 配置字段 |
| Cursor 客户端 DMG 恢复切片 | `cursor-projects-reversed/recovered/` | 桌面/Glass 侧 `cloudAgent*` / `localAgent*` / `cloudSubagent*` |
| 本 run 实测 | `live-probe/` | 脱敏后的身份、进程、端口、GitHub 边界 |

阅读顺序：先看 [../analysis/cloud-agent-architecture.zh-CN.md](../analysis/cloud-agent-architecture.zh-CN.md)，再看本目录的 proto 与客户端映射。
