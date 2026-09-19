# Muse reversed（Meta Endo / Hatch，从官方 macOS DMG 恢复）

输入：`/Users/jasper/Downloads/Muse-2.0.dmg`

原生 `Muse.app`（`com.meta.endo`）+ Chrome「Muse Browser Node」+ 内嵌 Hatch Web（CVM / Noise）。不是完整 Swift 源码。

```bash
cd muse-reversed
npm test
npm run recover -- --dmg /Users/jasper/Downloads/Muse-2.0.dmg
```

对照：`COMPARISON-CURSOR.md`。完整 hatch HTML / Mach-O 在 gitignored `work/payload/`。
