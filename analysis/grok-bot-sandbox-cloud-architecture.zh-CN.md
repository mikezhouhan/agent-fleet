# Grok Bot Sandbox / Cloud Agents 架构（本机证据 + sand 线索 + 与 Cursor Cloud 对照）

探测时间：2026-09-19（Asia/Shanghai）。本对话是共享 box 上的 `sand-subagent-*`；产物在 `grok-bot-sandbox-reversed/`。

> 原则：凡写「证据」均来自本机文件/进程/端口/字符串；「推断」单独标注。不收录密钥原文。

## 1. 一句话结论

Grok Bot 的「Computer」是跑在 **anyrun microVM** 里的 **sand box**：PID1 仍是 Anysphere/anyrun 的 `tini → pod-daemon`，工具面仍是 `@anysphere/exec-daemon-runtime`；之上叠了 **多窗桌面 + sand-host gateway + box-store 持久化 + egress tunnel**。同一物理 box 上可挂多个 agent（各占一个 X display / fork exec-daemon），由 `sand-window-router` 与 owner token 隔离。产品 UI deep link 为 `grokbot://…`，HTTP 出口代理名含 `xai`，但 host bundle 默认仍从 **Anysphere S3** 拉取。

## 2. 总架构图

见仓库本地完整版；本提交随后用完整正文覆盖。

PLACEHOLDER_SEE_LOCAL_COMMIT_18f1550
