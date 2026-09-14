# Agent Fleet

面向多 Coding Agent 编排的产品与架构研究：以 Grok Bot 的产品体验为参照，探索可替换原生 coding agent、ACP 接入、长期伙伴、混合团队协作与持久会话恢复。

## 阅读入口

- [六个项目的区别、优缺点与架构分析](analysis/multi-agent-grok-product-analysis.zh-CN.md)
- [五条演进路线总览与对比](analysis/routes/README.md)
- [路线一：基于 Cindy 演进](analysis/routes/01-cindy-evolution.zh-CN.md)
- [路线二：基于 Rakazo 演进](analysis/routes/02-rakazo-evolution.zh-CN.md)
- [路线三：基于 Agent Orchestrator 演进](analysis/routes/03-ao-evolution.zh-CN.md)
- [路线四：独立新建核心](analysis/routes/04-independent-core-evolution.zh-CN.md)
- [路线五：基于 DeepSeek Harness 演进](analysis/routes/05-deepseek-harness-evolution.zh-CN.md)

## 研究范围与方法

分析对象为 Kandev、Cindy、Grok Bot 0.18 重建版、Rakazo、Agent Orchestrator 与 DeepSeek Harness。报告基于固定源码快照，源码引用链接锁定到具体提交；完整版本记录见 [sources.json](sources.json)。

当前产出为静态源码分析与演进方案，尚未实现新产品，也未通过实际模型调用验证各项目的性能、稳定性或兼容性。报告区分已有能力、架构推断和拟议改造，不代表项目最新版本的持续评测。

本仓库仅包含研究报告；上游源码、素材与许可证请访问各原始仓库。Grok Bot 研究对象为非官方重建版本，其结论受可见源码范围限制。
