# 下载八个源码仓库与获取 Cursor Projects 恢复材料

本仓库保存分析报告和 Cursor Projects 客户端恢复证据。八个独立上游项目需要分别克隆，版本清单见 [sources.json](sources.json)。以下命令在 macOS、Linux 或 Windows Git Bash 中执行，需要先安装 Git。

## 1. 进入研究仓库

首次下载研究仓库：

```bash
git clone https://github.com/mikezhouhan/agent-fleet.git
cd agent-fleet
```

如果已经下载，直接进入现有的 `agent-fleet` 根目录。后续命令均从该目录执行。

## 2. 下载八个源码仓库

HTTPS 和 SSH 二选一，不要重复执行。若同名目录已经存在，先检查是否为已有克隆；不要删除已有工作来重跑命令。

### HTTPS

公开仓库通常不需要配置 SSH 密钥，适合直接下载：

```bash
git clone https://github.com/kdlbs/kandev.git
git clone https://github.com/makecindy/cindy.git
git clone https://github.com/b-nnett/grok-bot-0.18-reconstructed.git
git clone https://github.com/elie222/rakazo.git
git clone https://github.com/Untrivial-ai/agent-orchestrator.git
git clone https://github.com/deepseek-ai/deepseek-harness.git
git clone https://github.com/omnigent-ai/omnigent.git
git clone https://github.com/desplega-ai/agent-swarm.git
```

### SSH

如果已经将 SSH 公钥添加到 GitHub 账号，可以使用：

```bash
git clone git@github.com:kdlbs/kandev.git
git clone git@github.com:makecindy/cindy.git
git clone git@github.com:b-nnett/grok-bot-0.18-reconstructed.git
git clone git@github.com:elie222/rakazo.git
git clone git@github.com:Untrivial-ai/agent-orchestrator.git
git clone git@github.com:deepseek-ai/deepseek-harness.git
git clone git@github.com:omnigent-ai/omnigent.git
git clone git@github.com:desplega-ai/agent-swarm.git
```

SSH 连接失败时可执行 `ssh -T git@github.com` 检查认证；遇到 `Permission denied (publickey)`，可先改用上面的 HTTPS 地址下载。

下载后目录结构如下：

```text
agent-fleet/
├── README.md
├── sources.json
├── analysis/
├── kandev/
├── cindy/
├── grok-bot-0.18-reconstructed/
├── rakazo/
├── agent-orchestrator/
├── deepseek-harness/
├── omnigent/
├── agent-swarm/
└── cursor-projects-reversed/
```

八个独立上游源码目录都已被研究仓库的 `.gitignore` 忽略，每个目录保留自己的 Git 历史和远端。`cursor-projects-reversed/` 则由本研究仓跟踪，随研究仓一起下载。

## 3. 复现报告使用的源码版本

普通 `git clone` 下载的是上游当前默认分支，可能与报告分析的版本不同。核对报告结论时，在研究仓库根目录执行以下命令，切换到 `sources.json` 记录的固定提交：

```bash
git -C kandev checkout --detach 753e5549ee730245e4124654052b8b9e364d630c
git -C cindy checkout --detach f4422f816ccbadbcd29714dc0722e581bb08e172
git -C grok-bot-0.18-reconstructed checkout --detach a9f633e09d49a85829b8236331b9e21f7e612634
git -C rakazo checkout --detach b286fc4a5d0f608005000ef35bee4c473c31a165
git -C agent-orchestrator checkout --detach ab968d5e761469eb32c1b4dc780cde721a9998de
git -C deepseek-harness checkout --detach c291e7961a515f6d7af9304e7fd1d257929aef26
git -C omnigent checkout --detach 2a05baf4399dac074f5d29fb618bd0c7f09ec8f4
git -C agent-swarm checkout --detach 1821593fa588cea3a52f10ef5f6c4be72ce6761a
```

这些命令适用于新克隆、没有本地修改的仓库。对已有工作目录，先用 `git -C <目录名> status` 检查并保存自己的修改。`--detach` 表示停留在指定提交，适合只读研究；若要在这个版本上开发，可以在对应源码目录执行 `git switch -c my-experiment` 创建分支。

如果已有克隆缺少指定提交，先执行 `git -C <目录名> fetch origin` 再重试。浅克隆可能需要先执行 `git -C <目录名> fetch --unshallow` 获取历史；上面的下载命令使用完整克隆。

例如，核对 Cindy 当前版本：

```bash
git -C cindy rev-parse HEAD
```

输出应为 `f4422f816ccbadbcd29714dc0722e581bb08e172`。其余仓库同样与 `sources.json` 中的 `commit` 比对。

## 4. Cursor Projects 恢复材料

`cursor-projects-reversed/` 已包含在本仓库中，无需单独 clone。已有较早版本的研究仓可以先执行 `git pull --ff-only` 获取。它是 Cursor 3.20.17 macOS arm64 分发包的客户端切片、schema、来源记录与恢复脚本，不是官方完整源码或可运行克隆。

本次报告引用研究仓提交 `06c9086284257611dd95d3367ee74e0cfafb05eb` 中的材料。若需要在不切换当前工作目录的情况下查看精确版本，可从研究仓根目录建立只读研究用途的 detached worktree：

```bash
git worktree add --detach ../agent-fleet-cursor-snapshot 06c9086284257611dd95d3367ee74e0cfafb05eb
```

恢复来源和安装包哈希见 [PROVENANCE.md](cursor-projects-reversed/PROVENANCE.md)。完整安装包与 `work/payload/` 不随研究仓发布。通常直接阅读已有切片即可；如需重新提取，须自行准备与记录哈希一致的 macOS DMG，再按[恢复目录说明](cursor-projects-reversed/README.md)运行脚本，并使用自己的安装包路径。最新版安装包未必与本次快照一致。

恢复切片并不保证模块语义完整，详细边界见 [Cursor 专题](analysis/extensions/cursor-projects-analysis.zh-CN.md)。

## 5. 后续阅读与运行

优先阅读 [九项目综合比较](analysis/extensions/nine-project-comparison.zh-CN.md) 和 [Agent Swarm 专题](analysis/extensions/agent-swarm-analysis.zh-CN.md)，也可从 [分析总览](analysis/multi-agent-grok-product-analysis.zh-CN.md) 或 [七条演进路线](analysis/routes/README.md) 开始阅读。报告中的源码链接也直接指向 GitHub 上的固定提交，无需下载即可查看。

克隆只完成源码下载；依赖安装、子模块或大文件资源、环境变量及启动步骤请按各项目对应版本的 README 和开发文档执行。Grok Bot 仓库是非官方重建版本，不能据此假定包含原产品的完整源码与运行环境。
