# 新手交易系统化入门丛书

本仓库同时存放书稿与网页版：`content/` 是**唯一内容源**，`apps/web/` 是基于
**VitePress** 的阅读站，直接渲染 Markdown，不再维护自研渲染器。

- 8 册 / 77 章 / 约 48.7 万字（可读正文）
- 按章路由：`/b1/b1-c01.html`；每册一个落地页 `/b1.html` ~ `/b8.html`
- 旧地址 `b1-map.html`、`risk-math.html` 保留为跳转页

## 环境要求

- Node.js 20.19+ 或 22.12+
- pnpm 12（仓库已声明 `packageManager`，可用 `corepack enable` 自动切换）

## 快速开始

```bash
pnpm install
pnpm dev       # 启动 VitePress 开发服务器（内容改动即时热更新，默认 5173）
pnpm check     # 内容校验 + tools 类型检查 + 网页类型检查
pnpm build     # 生产构建，输出 apps/web/.vitepress/dist
pnpm preview   # 预览构建产物（默认 4173；重新构建后需重启 preview）
```

只处理内容、不启动网页：

```bash
pnpm content:build   # 生成编辑侧产物（汇编稿 / 总索引 / verify.json）
pnpm content:check   # 只跑内容校验
```

## 目录结构

```
.
├── content/                    # 书稿：唯一内容源（VitePress srcDir）
│   ├── series.yaml             # 丛书元数据、分册顺序、期望章数
│   ├── index.md                # 站点首页
│   ├── [volume].md (+ .paths.ts)  # 分册落地页（构建期按 series.yaml 生成）
│   ├── B1/ ... B8/             # 各章 .md 与 *_delivery.md
│   ├── editorial/              # 编辑资料（Bible、_meta、旧汇编稿），不参与站点
│   └── dist/                   # 编辑侧产物，勿手改、不入库
├── apps/web/
│   ├── .vitepress/
│   │   ├── config.mts          # srcDir / rewrites / 侧栏 / 搜索 / 每册主题色注入
│   │   ├── plugins/content.ts  # markdown-it 插件：小节卡片、交叉引用、自测题等
│   │   └── theme/              # 扩展默认主题 + 全站深色样式（custom.css）
│   ├── components/             # 交互组件（Vue SFC，可直接写在正文里）
│   └── lib/                    # echarts 按需封装、图表主题
├── packages/content-model/     # zod schema 与共享 TypeScript 类型
├── tools/content/              # 内容解析与校验（check.ts 是编辑门禁）
│   └── legacy/                 # 已停用的 Python/PowerShell 脚本存档
└── pnpm-workspace.yaml
```

## 内容流水线

```
content/series.yaml + content/Bn/*.md
        │
        ├─ tools/content/check.ts   编辑门禁：结构、字数、禁用词、交叉引用
        │
        └─ VitePress（apps/web）    直接渲染 Markdown
                ├─ plugins/content.ts   ## 小节 → 卡片、〔B?-C??〕→ 链接、
                │                        【待核验】→ 徽标、绘图说明 → 折叠、
                │                        误区 → callout、自测题 → details
                └─ config.mts           侧栏/导航（读 series.yaml）、
                                         每册 accent 主题色按页注入、
                                         本地搜索（CJK bigram 分词）
```

开发时修改 `content/**/*.md`，VitePress 即时热更新，无需手动构建。

## 章节格式

章文件名为 `content/Bn/Bn-Cxx.md`，开头是标准 YAML frontmatter：

```markdown
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

正文使用固定小节，缺一即校验失败：

`开场问题`、`一句话结论`、`本章学习目标`、`正文`、`常见误区`、`本章小结`、
`自测题`、`速查卡`（允许带括号副标题）、`延伸与链接`、`⚠️ 风险提示`。

渲染插件处理这些约定：

- `〔B3-C04〕` 自动变成指向对应章节页的链接
- `【待核验】` 自动变成黄色标记
- 以 `绘图说明` 开头的段落变成可折叠的制作提示
- 小节标题进入右侧 outline，供页内目录与锚点跳转

`content/editorial/` 下的文件不参与构建，用于保存编辑规范、历史汇编与验收资料。

## 编辑工作流

1. 修改 `content/Bn/Bn-Cxx.md`（正文只写在这一处）。
2. 运行 `pnpm content:check`，确认章节完整、字数、禁用词与交叉引用。
3. 运行 `pnpm dev` 直接预览，内容热更新。
4. 提交时不要包含 `content/dist/` 与 `apps/web/.vitepress/dist/`。

校验规则要点：

- 每册实际章数必须等于 `content/series.yaml` 中的 `expectedChapters`
- `status` 必须为 `final`，`new_terms` 不超过 8 个
- 每章必须有对应的 `*_delivery.md`
- 正文字数下限 2400；超过 8000 只警告，不阻塞
- 正文不得出现全角感叹号
- 禁用词只有出现在驳斥、引用、防骗等语境中才放行
- 交叉引用必须指向真实存在的章节

## 交互组件

组件直接写在正文里，跟随内容版本管理。现有组件：

| 组件 | 位置 |
|---|---|
| `<ThreeQuestions />` 三问归类器 | B1-C01 |
| `<ExpectancyExplorer />` 期望值探索器 | B1-C03、B3-C08 |
| `<RecoverCurve />` 回本曲线 | B3-C01 |
| `<PositionCalculator />` 仓位计算器 | B3-C04 |
| `<GapConstraint />` 最坏跳空约束 | B3-C06 |
| `<DrawdownStreak />` 连亏与回撤 | B3-C10 |

新增组件只需两步：

1. `apps/web/components/` 新建 Vue SFC
2. 在 `apps/web/.vitepress/theme/index.ts` 注册（重组件用 `defineAsyncComponent`）

然后在任意章节正文里写 `<组件名 />` 并运行 `pnpm content:check`。

## 网页结构

- `content/index.md`：丛书总览，数据由 config.mts 读 series.yaml 注入主题
- `content/[volume].paths.ts`：构建期生成 8 个分册落地页
- 章节页按章拆分（`/b3/b3-c04.html`），侧栏为分册章节树，右侧 outline 为本页小节
- 每册主题色由 `transformPageData` 向页面 head 注入 accent 变量覆盖
- 本地搜索开启 CJK 双字分词（`config.mts` 中的 `cjkTokenize`）
- VitePress `base` 为默认 `/`；如需部署到子路径，改 `base` 并同步跳转页里的链接

## 部署

```bash
pnpm build
# 将 apps/web/.vitepress/dist 整个目录发布到静态托管
```

当前未配置 CI。`apps/web/.vitepress/dist`、`apps/web/.vitepress/cache` 与
`content/dist` 都是生成物，已被 `.gitignore` 忽略。

## 其他

- 远程仓库：`https://github.com/MUTTERTOOLS/trading-handbook-web`
- 旧的手写章节组件与 Python/PowerShell 脚本存档于 `tools/content/legacy/`，仅作参考
- `tools/github-publish.mjs` 仅在 git 推送不可用时作为 GitHub API 兜底发布工具
