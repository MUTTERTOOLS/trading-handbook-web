# 网页阅读版

《新手交易系统化入门丛书》的 Vite 7 + Vue 3 + TypeScript 阅读站。正文来自仓库根目录的
`content/`，本应用只负责渲染、导航与交互，不保存书稿副本。

完整的内容规范、编辑流程与组件编排说明见[根目录 README](../../README.md)。

## 命令

在仓库根目录执行：

```bash
pnpm dev       # 构建内容 + 启动开发服务器（5173）
pnpm build     # 构建内容 + 类型检查 + 生产构建（输出 apps/web/dist）
pnpm preview   # 预览生产构建（4173）
pnpm check     # 内容校验 + tools 类型检查 + 网页类型检查
```

只启动网页开发服务器（需先有 `content/dist`）：

```bash
pnpm content:build
pnpm --filter @trading-handbook/web dev
```

## 页面

| 入口 | 内容 |
|---|---|
| `index.html` | 丛书总览，数据来自 `content/dist/series.json` |
| `b1.html` ~ `b8.html` | 各册全文，`<html data-volume="bN">` 决定主题色 |
| `b1-map.html` | 旧地址，静态跳转到 `b1.html` |
| `risk-math.html` | 旧地址，静态跳转到 `b3.html` |

所有入口在 `vite.config.ts` 的 `rollupOptions.input` 中登记；新增分册时需要同时添加
HTML 入口与 `src/content/index.ts` 中的分册加载器。

## 目录

```
apps/web/
├── index.html / b1.html ... b8.html
├── vite.config.ts              # MPA 入口、@ 与 @content 别名
└── src/
    ├── pages/
    │   ├── home/               # 首页
    │   └── volume/             # 分册入口（按 data-volume 加载）
    ├── content/
    │   ├── index.ts            # series / edition / 分册异步加载
    │   ├── VolumePage.vue      # 分册封面、侧栏目录、页脚
    │   ├── ChapterRenderer.vue # 章节头 + 按锚点插入组件
    │   ├── BlockRenderer.vue   # AST 区块渲染
    │   ├── WidgetHost.vue      # 组件宿主
    │   └── content.css         # 正文排版样式
    ├── widgets/                # 交互组件（异步加载）
    ├── shared/
    │   ├── components/         # SideNav、QuizItem、RiskNotice 等
    │   ├── lib/                # echarts 按需注册与图表主题
    │   └── styles/             # tokens / themes / base / layout / components
    └── legacy/                 # 旧手写章节页面，不参与构建与类型检查
```

## 渲染约定

- 书稿在 `content/dist` 中被解析为 JSON AST，`BlockRenderer` 按 `block.type` 渲染。
- 章内锚点由解析器生成，例如 `b1-c01-s1`、`b1-c01-summary`。
- 交互组件由 `content/edition.yaml` 按 `afterText` 锚点插入，组件 id 必须在
  `src/widgets/index.ts` 与 `tools/content/edition.ts` 中同时注册。
- `WidgetHost` 使用 `defineAsyncComponent`，只有页面真正出现组件时才加载对应代码与 echarts。
- 图表颜色从 CSS 变量读取，切换分册主题时无需改组件。

## 样式与主题

`src/shared/styles/tokens.css` 是设计令牌的唯一默认值来源；`themes.css` 按
`html[data-volume='b1']` ~ `[data-volume='b8']` 覆盖 `--accent`、`--accent-dim`、
`--accent-glow`、`--border-accent`。组件与图表只引用变量，不写死颜色。

## 部署

`pnpm build` 后发布 `apps/web/dist` 即可。构建使用相对路径 `base: './'`，可部署在域名根目录
或任意子路径，不依赖服务端路由；两个旧地址通过 HTML meta refresh 跳转。
