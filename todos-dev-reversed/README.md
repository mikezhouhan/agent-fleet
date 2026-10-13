# Todos 恢复材料（桌面壳 + runner CLI）

这是 2026-10-08 从官方分发里抽出的可读切片，不是上游仓库，也不是可重签名、可运行的克隆。控制面（Chief、看板、编排、账号）不在这些文件里。

## 来源

| 材料 | 版本 | 获取 |
|---|---|---|
| Mac 桌面安装包（Apple Silicon） | Todos `0.1.12`，`dev.todos.desktop` | https://assets.todos.dev/desktop/Todos-arm64.dmg |
| Mac 桌面安装包（Intel） | 同上 `0.1.12` | https://assets.todos.dev/desktop/Todos-x64.dmg |
| runner npm 包 | `@todos-dev/cli@0.1.60`（命令 `tds`） | https://registry.npmjs.org/@todos-dev/cli/-/cli-0.1.60.tgz |
| 官方安装说明 | 页面写明 `npm install -g @todos-dev/cli@latest` 然后 `tds start` | https://todos.dev/docs/install 、https://todos.dev/docs/cli |

包名不是猜测：安装文档、桌面壳 `Resources/machine/package.json`、以及 npm `latest` 都指向 `@todos-dev/cli`。同组织下的 `@todos-dev/cli-<platform>-<arch>` 是 `tds-tunnel` 边车，不是 runner 本体。

获取日：2026-10-08。registry 上 `0.1.60` 的发布时间是 `2026-10-08T01:19:49.082Z`。两份 DMG 的 `Last-Modified` 同为 `2026-10-08 01:50` 左右。

## 校验和

| 对象 | SHA-256 |
|---|---|
| `Todos-arm64.dmg`（180526015 字节） | `64a18e9b126a76a8224057303e592c518e3c346f7f26155a2e754801dbf5682c` |
| `Todos-x64.dmg`（188152561 字节） | `abaaa69f24a77d5d7e83068f742d782dc24c336aa527b98e49d5c706404fb84c` |
| npm `dist/index.js`，以及两份 DMG 里 `Resources/machine/dist/index.js` | `6753d4ff4a494cf6195b6a48b1d67b6bea3598211465fa84e9394dc961b2494f` |
| 两份 DMG 抽出的 `Resources/app.asar`（3127528 字节，彼此相同） | `5b29ed7847b4a108b351c6dd32df0567240bec1d5b4ae38e3131756cb1a70e16` |
| arm64 `Resources/machine/bin/tds-tunnel`（Mach-O arm64，20741552 字节） | `404b745e6c800720984bcf936d18bbed507213dd79441d8b77c70216ad999132` |
| 随包网页入口 `entry-768b1d60ce3414808d46088505aa656b.js` | `404ef0b74d730291e8f68713b08da99b73b045d96210c3343972039d7d01eebd` |

`Info.plist` 的 `ElectronAsarIntegrity` 写成 `b21028c683f5e42d5d94abfefaf52a578b7f3ce64cdeddb393551ab86f277b82`，与上面抽出的 asar 字节哈希不一致。两架构 asar 彼此相同，sourcemap 可以完整还原壳的 TypeScript。本环境没有用 Apple `codesign` 复核签名。

npm 包 integrity：`sha512-3wDaTmAu+Z7Mkm1VbI7fy5ytjo+2V0in+qj2RsQS+eTfvqd4kUFdfN+xdVDWbYQgYXd6UQYdC+YVVPP5rWBnDg==`。发布包没有 `license` 字段。

## 目录里有什么

- `cli/package.json`、`cli/dist/index.js`：发布包的全部内容（esbuild 打包，约 1.4 万行，带 `// src/...ts` 边界）。`cli/module-index.json` 是这些边界的行号索引。
- `desktop/package.json`：壳的身份，`@tds/desktop@0.1.12`，描述自己是「Electron shell around the web app」。
- `desktop/recovered/`：从 `app.asar` 的 `dist/main/index.js.map` 与 `dist/preload/index.js.map` 的 `sourcesContent` 还原的本仓库源文件（不含 `node_modules`）。其中 `executor/src/lib/` 只是壳引用到的那几份，完整 runner 在 `cli/dist/index.js`。

`node check.mjs` 核对 CLI 哈希、版本和几处入口函数是否还在。

## 没有入库的东西

| 未入库 | 原因 |
|---|---|
| 两份 DMG、Electron Framework、Helper、`app.asar` 原件 | 大型二进制 / 磁盘映像。URL 与校验和在上表 |
| `tds-tunnel`（约 20MB Mach-O） | 大型二进制。Go 模块路径字符串为 `github.com/todos-dev/tds-tunnel`，由 CLI 以 NDJSON 拉起。可选 npm 边车 `@todos-dev/cli-darwin-arm64@0.1.60` 解包约 20MB，同样不入库 |
| 桌面壳 `Resources/machine/node_modules`（约 445MB） | 运行时依赖树，不是协议本身。直接依赖版本见下 |
| Metro 网页包（`Resources/app/_expo`，入口约 4MB） | 压缩后的界面包。壳的源码已经说明它只是 `https://todos.dev` 的同源静态页，`/api` 与登录仍走网络 |
| sourcemap 原件 | 已把其中的自有 `sourcesContent` 写成 `desktop/recovered/` |

桌面壳 `machine/node_modules` 里与 runner 直接相关的版本：

| 包 | 版本 |
|---|---|
| `@earendil-works/pi-coding-agent` | 1.0.0 |
| `@earendil-works/pi-ai` | 1.0.0 |
| `@anthropic-ai/claude-agent-sdk` | 0.3.226 |
| `@modelcontextprotocol/sdk` | 1.32.1 |
| `undici` | 7.30.0 |
| `eventsource` | 4.1.1 |

发布包的 `dist/index.js` 在运行时 `import()` / `require()` 这些包，协议与 harness 适配写在包内。读安装、注册、领取和回合协议不需要整棵依赖树。

## 阅读

专题分析：[analysis/extensions/todos-dev-analysis.zh-CN.md](../analysis/extensions/todos-dev-analysis.zh-CN.md)。

本环境是 Linux，没有启动 `Todos.app`，没有登录，没有执行 `tds start` 注册机器。
