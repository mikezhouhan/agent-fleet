# Agent Fleet

面向多 Coding Agent 编排的产品与架构研究：以 Grok Bot 的产品体验为参照，探索可替换原生 coding agent、ACP 接入、长期伙伴、混合团队协作与持久会话恢复。

## 阅读入口

- [十项目综合比较与更新后的路线建议](analysis/extensions/ten-project-comparison.zh-CN.md)
- [Memoh：长期记忆、独立电脑与第八条演进路线](analysis/extensions/memoh-analysis.zh-CN.md)
- [Agent Swarm：持久任务团队与第七条演进路线](analysis/extensions/agent-swarm-analysis.zh-CN.md)
- [Cursor Projects：产品机制与恢复证据](analysis/extensions/cursor-projects-analysis.zh-CN.md)
- [Omnigent：多 Harness 底座与第六条演进路线](analysis/extensions/omnigent-analysis.zh-CN.md)
- [下载九个源码仓库与获取 Cursor 恢复材料](SOURCE_DOWNLOAD.zh-CN.md)
- [六个项目的区别、优缺点与架构分析](analysis/multi-agent-grok-product-analysis.zh-CN.md)
- [八条底座演进路线](analysis/routes/README.md)
- [路线一：基于 Cindy 演进](analysis/routes/01-cindy-evolution.zh-CN.md)
- [路线二：基于 Rakazo 演进](analysis/routes/02-rakazo-evolution.zh-CN.md)
- [路线三：基于 Agent Orchestrator 演进](analysis/routes/03-ao-evolution.zh-CN.md)
- [路线四：独立新建核心](analysis/routes/04-independent-core-evolution.zh-CN.md)
- [路线五：基于 DeepSeek Harness 演进](analysis/routes/05-deepseek-harness-evolution.zh-CN.md)

## 研究范围与方法

比较对象为 Kandev、Cindy、Grok Bot 0.18 重建版、Rakazo、Agent Orchestrator、DeepSeek Harness、Cursor Projects 客户端恢复材料、Omnigent、Agent Swarm 与 Memoh。原六项目报告保留其固定基准；2026-09-15 增补报告先后纳入四个新对象。报告基于固定源码快照，源码引用链接锁定到具体提交；完整版本记录见 [sources.json](sources.json)。

当前产出为静态源码分析与演进方案，尚未实现新产品，也未通过实际模型调用验证各项目的性能、稳定性或兼容性。报告区分已有能力、架构推断和拟议改造，不代表项目最新版本的持续评测。

本仓库包含研究报告和 `cursor-projects-reversed/` 客户端恢复证据；九个独立上游仓库需另行下载，其源码、素材与许可证请访问各原始仓库。Grok Bot 研究对象为非官方重建版本，其结论受可见源码范围限制。
