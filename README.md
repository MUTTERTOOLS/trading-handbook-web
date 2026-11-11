# 新手交易系统化入门丛书

本仓库同时存放书稿与网页版：`content/` 是**唯一内容源**，`apps/web/` 是它的阅读应用。
网页不复制正文，而是读取书稿解析出的 JSON AST 来渲染；交互组件只负责计算与演示。

- 8 册 / 77 章 / 约 48.7 万字（可读正文）
- 每册一个独立页面：`b1.html` ~ `b8.html`
- 旧地址 `b1-map.html`、`risk-math.html` 保留为跳转页

## 环境要求

- Node.js 20.19+ 或 22.12+
- pnpm 12（仓库已声明 `packageManager`，可用 `corepack enable` 自动切换）

## 快速开始

```bash
pnpm install
pnpm dev       # 构建内容并启动开发服务器（默认 5173）
pnpm check     # 内容校验 + tools 类型检查 + 网页类型检查
pnpm build     # 构建内容 + 生产构建，输出 apps/web/dist
pnpm preview   # 预览 apps/web/dist（默认 4173）
```

只处理内容、不启动网页：

```bash
pnpm content:build   # 重新生成 content/dist
pnpm content:check   # 只跑内容校验
```

开发时修改 `content/**/*.md` 后，在另一个终端执行 `pnpm content:build` 即可让页面热更新；
`pnpm dev` 只在启动时构建一次内容。

## 目录结构

```
.
├── content/                    # 书稿：唯一内容源
│   ├── series.yaml             # 丛书元数据、分册顺序、期望章数
│   ├── edition.yaml            # 网页交互组件插在哪（按正文锚点）
│   ├── B1/ ... B8/             # 各章 .md 与 *_delivery.md
│   ├── editorial/              # 编辑资料（Bible、_meta、旧汇编稿），不参与构建
│   └── dist/                   # 生成物，勿手改、不入库
├── apps/web/                   # Vite 7 + Vue 3 + TypeScript 阅读站
│   ├── index.html              # 丛书总览
│   ├── b1.html ... b8.html     # 分册入口
│   ├── src/content/            # 通用 AST 渲染器
│   ├── src/widgets/            # 交互组件
│   ├── src/pages/              # 首页与分册页入口
│   └── src/shared/             # 样式、布局、图表主题、通用组件
├── packages/content-model/     # zod schema 与共享 TypeScript 类型
├── tools/content/              # 内容解析、构建、校验
│   └── legacy/                 # 已停用的 Python/PowerShell 脚本存档
└── pnpm-workspace.yaml
```

## 内容流水线

```
content/series.yaml + content/Bn/*.md
        │
        ├─ parse.ts      解析 frontmatter、Markdown、章节结构、交叉引用、图表说明
        ├─ edition.ts    读取 edition.yaml，校验组件锚点
        └─ build.ts      输出 content/dist
                │
                └─ apps/web  读取 JSON AST → BlockRenderer / ChapterRenderer
```

`content:build` 每次都会清空并重建 `content/dist`：

| 产物 | 用途 |
|---|---|
| `series.json` | 首页与分册导航使用的丛书摘要 |
| `edition.json` | 校验后的交互组件编排 |
| `volumes/Bn.json` | 网页按册异步加载的完整内容 |
| `chapters/Bn-Cxx.json` | 单章 AST，便于检索与后续复用 |
| `compiled/Bn.md` | 各册汇编稿 |
| `00_总索引.md` | 全书总索引 |
| `search.json` | 章节标题、小节、正文的搜索数据 |
| `verify.json` | 全部【待核验】条目及上下文 |
| `build-report.json` | 本次构建统计 |

## 章节格式

章文件名为 `content/Bn/Bn-Cxx.md`，开头是一段围栏 YAML frontmatter（注意不是 `---` 直接开头）：

````markdown
```yaml
---
chapter_id: B1-C01
title: 交易、投资与赌博的边界
prerequisites: []
new_terms: [期望值, 对手盘, 零和, 正和, 负和, 书面规则, 宽基 ETF]
formulas: []
constants_used: [EX-A]
status: final
---
```
````

正文使用固定小节，缺一即校验失败：

`开场问题`、`一句话结论`、`本章学习目标`、`正文`、`常见误区`、`本章小结`、
`自测题`、`速查卡`（允许带括号副标题）、`延伸与链接`、`⚠️ 风险提示`。

解析器还会处理这些约定：

- `〔B3-C04〕` 自动变成指向对应分册章节的链接
- `【待核验】` 自动变成黄色标记，并计入 `verify.json`
- 以 `绘图说明` 开头的段落变成可折叠的制作提示
- 每个三级标题生成稳定锚点，供侧栏目录与组件定位使用

`content/editorial/` 下的文件不参与构建，用于保存编辑规范、历史汇编与验收资料。

## 编辑工作流

1. 修改 `content/Bn/Bn-Cxx.md`（正文只写在这一处）。
2. 运行 `pnpm content:check`，确认章节完整、字数、禁用词、交叉引用与组件锚点。
3. 运行 `pnpm dev` 或 `pnpm build` 查看网页效果。
4. 提交时不要包含 `content/dist/` 与 `apps/web/dist/`。

校验规则要点：

- 每册实际章数必须等于 `content/series.yaml` 中的 `expectedChapters`
- `status` 必须为 `final`，`new_terms` 不超过 8 个
- 每章必须有对应的 `*_delivery.md`
- 正文字数下限 2400；超过 8000 只警告，不阻塞
- 正文不得出现全角感叹号
- 禁用词只有出现在驳斥、引用、防骗等语境中才放行
- 交叉引用必须指向真实存在的章节

## 交互组件

组件位置由 `content/edition.yaml` 决定，不在正文里写标记。`afterText` 必须是该章某个
**顶层区块**正文中的一段原句；构建和校验都会检查锚点，正文改动后锚点失效会直接报错。

当前组件：

| id | 组件 | 位置 |
|---|---|---|
| `ThreeQuestions` | 三问归类器 | B1-C01 |
| `ExpectancyExplorer` | 期望值探索器 | B1-C03、B3-C08 |
| `RecoverCurve` | 回本曲线 | B3-C01 |
| `PositionCalculator` | 仓位计算器 | B3-C04 |
| `GapConstraint` | 最坏跳空约束 | B3-C06 |
| `DrawdownStreak` | 连亏与回撤 | B3-C10 |

新增组件需要同步三处：

1. `apps/web/src/widgets/` 新建 Vue 组件
2. `apps/web/src/widgets/index.ts` 注册异步组件
3. `tools/content/edition.ts` 的 `WIDGET_IDS` 加入 id

然后在 `content/edition.yaml` 里写锚点并运行 `pnpm content:check`。

## 网页结构

- `apps/web/src/pages/home/`：丛书总览，数据来自 `series.json`
- `apps/web/src/pages/volume/`：分册入口，按 `data-volume` 加载对应分册
- `apps/web/src/content/`：`VolumePage` → `ChapterRenderer` → `BlockRenderer` 通用渲染链
- `apps/web/src/widgets/`：按需异步加载的交互组件，避免无图表页面下载 echarts
- `apps/web/src/shared/styles/themes.css`：每册主题色，组件只引用 CSS 变量

Vite 使用 MPA 多入口，`apps/web/vite.config.ts` 中登记 `index`、`b1`~`b8` 与两个旧地址跳转页。
`base` 为 `./`，构建产物可直接部署到任意静态目录或子路径，不需要服务端路由。

## 部署

```bash
pnpm build
# 将 apps/web/dist 整个目录发布到静态托管
```

当前未配置 CI。`apps/web/dist` 与 `content/dist` 都是生成物，已被 `.gitignore` 忽略。

## 其他

- 远程仓库：`https://github.com/MUTTERTOOLS/trading-handbook-web`
- 旧的手写章节组件保存在 `apps/web/src/legacy/`，不参与类型检查与构建
- 旧的 Python/PowerShell 内容脚本保存在 `tools/content/legacy/`，仅作参考
- `apps/web/scripts/github-publish.mjs` 已移至 `tools/github-publish.mjs`，仅在 git 推送不可用时作为 GitHub API 兜底发布工具
