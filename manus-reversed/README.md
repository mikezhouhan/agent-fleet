# Manus reversed（从官方 macOS DMG 恢复桌面核心）

从指定安装包

`/Users/jasper/Downloads/Manus-Setup-1.7.6.dmg`

恢复 **Manus 1.7.6** 桌面客户端里与 sandbox/session、skills、MCP、sidecar 相关的实现，并与 `cursor-projects-reversed` 对照。

这不是完整 Manus 源码。云端 planner/executor 循环、远程 VM hypervisor 不在本 DMG 的 `dist/` 里，见 `COMPARISON-CURSOR.md` 缺口。

## 恢复

```bash
cd manus-reversed
npm install
npm run recover -- --dmg /Users/jasper/Downloads/Manus-Setup-1.7.6.dmg
npm test
```

入口：`scripts/recover.mjs`。完整 asar 解包在 gitignored 的 `work/payload/`。

## 阅读入口

- [PROVENANCE.md](PROVENANCE.md)
- [COMPARISON-CURSOR.md](COMPARISON-CURSOR.md)
- [inventory.json](inventory.json)
- [NOTICE.md](NOTICE.md)
