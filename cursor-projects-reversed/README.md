# Cursor Projects reversed（从官方 macOS DMG 恢复客户端单元）

本目录面向安全团队：从指定安装包

`/Users/jasper/Downloads/Cursor-darwin-arm64.dmg`

恢复 **Cursor Projects** 相关的客户端实现，并给出证据引用型安全观察（不是对照未提供的公司规范出具合格证书）。

这不是 Cursor 的完整源码，也不是可运行/重签名的克隆。云端 coordinator、VM 运行时、Slack/Git 投递与多数共享上下文存储实现不在本 DMG 内，审查文档会标明缺口。

## 恢复

```bash
cd cursor-projects-reversed
npm install
npm run recover -- --dmg /Users/jasper/Downloads/Cursor-darwin-arm64.dmg
npm test
```

入口：`scripts/recover.mjs`。它会：

1. 计算 DMG SHA-256
2. 只读挂载 DMG
3. 定位 `Cursor.app` 与 payload（本版本是未打包的 `Contents/Resources/app`，不是单一 `app.asar`）
4. 按 shipped path/symbol 分类 coordinator、cloud/local agent、shared context、subscriptions
5. 把该子集 beautify/切片写入 `recovered/`
6. 写出 `inventory.json`（recovered file → shipped path → symbols）与 `provenance.json`

完整 payload 工作副本在 gitignored 的 `work/payload/`。

## 阅读入口

- [PROVENANCE.md](PROVENANCE.md) — DMG / 版本 / payload 身份
- [SECURITY-REVIEW.md](SECURITY-REVIEW.md) — 出站、存储、密钥、本机执行、订阅
- [inventory.json](inventory.json) — 机器可读映射（运行 recover 后生成）
- [NOTICE.md](NOTICE.md) — 不是原版源码

## 方法

分类与切片都是对已挂载 payload 的纯函数，测试直接驱动这些函数，不启动 `Cursor.app`。
