# 客户端 / UI 映射线索

本 box **没有**完整 Electron 客户端源码树。可用线索：

## 箱内 reference（证据）

| 文件 | 内容 |
| --- | --- |
| `/home/box/reference/app-ui.md` | 真实设置路径与 `grokbot://app/v1/settings?id=…` deep link；账号卡文案仍写 “Sign In with Cursor” |
| `/home/box/reference/debugging-the-box.md` | 本地 Docker vs anyrun；`box-doctor`；Update/Reset Computer |

## 契约生成注释（证据）

`box-contract.generated.mjs` → `sand/src/shared/box/box-contract.ts`。

## 仓库内既有材料（交叉引用）

- 研究仓对非官方重建版：`sources.json` → `grok-bot-0.18-reconstructed`
- Cursor 客户端切片：`cursor-projects-reversed/`（Cloud Agent / localAgent 命名）

**推断**：Grok Bot 桌面应用与 Cursor/sand 共享大量计算机与鉴权表面；产品文案与 deep link scheme 已换成 Grok Bot，但 reference 仍残留 “Sign In with Cursor”。
