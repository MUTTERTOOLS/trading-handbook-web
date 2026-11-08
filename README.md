# trading-handbook-web

《新手交易系统化入门丛书》交互阅读版。Vite 7 + Vue 3 + TypeScript，MPA 多入口打包，
每册一个独立页面（`xxx.html`），共享样式与组件。

## 常用命令

```bash
pnpm dev        # 开发服务器
pnpm build      # vue-tsc 类型检查 + vite 构建（输出 dist/）
pnpm preview    # 预览构建产物（本机 4173 端口）
```

## 目录结构

```
├── index.html               # 首页（丛书总览，默认主题色）
├── risk-math.html           # 册三主题页（<html data-volume="b3"> 指定主题色）
├── vite.config.mts          # MPA 入口在此登记
└── src/
    ├── pages/
    │   ├── home/            # 首页
    │   └── risk-math/       # 册三（B3）
    │       └── components/  # ChapterOne~Twelve：每章一个组件（全文）
    └── shared/
        ├── styles/
        │   ├── tokens.css      # 设计令牌（颜色/字体/圆角），唯一的默认值来源
        │   ├── themes.css      # 分册主题色 [data-volume="b1"~"b8"]，覆盖 --accent 系
        │   ├── base.css        # 重置与排版
        │   ├── layout.css      # 侧栏/主栏/封面/章节骨架
        │       └── components.css # 提示框/表格/计算器/自测题/速查卡等
        ├── components/         # 跨页面复用组件（见下表）
        └── lib/                # echarts 按需注册 + 图表主题
```

## 分册主题色

每册一个主题色，写在 `themes.css` 的 `html[data-volume='bN']` 块里（覆盖 `--accent` /
`--accent-dim` / `--accent-glow` / `--border-accent` 四个变量）。组件与图表**只引用变量，
不写死颜色**：CSS 自动跟随；ECharts 在每次绘制时通过 `getChartTheme()` 读取当前主题。

| 册 | data-volume | 主题色 | 寓意 |
|---|---|---|---|
| B1 | `b1` | 蓝 `#60a5fa` | 认知起点 |
| B2 | `b2` | 青 `#3cc5d8` | 规则与秩序 |
| B3 | `b3` | 橙 `#fb923c` | 风险警示（全站默认） |
| B4 | `b4` | 紫 `#c084fc` | 图表与结构 |
| B5 | `b5` | 绿 `#57c78a` | 价值与增长 |
| B6 | `b6` | 玫红 `#f472b6` | 检验与证据 |
| B7 | `b7` | 金黄 `#e8c268` | 纪律与习惯 |
| B8 | `b8` | 红 `#f87171` | 实战与取舍 |

> 色板为深底阅读调校：统一 400 系明度、压低饱和度，小字与大面积强调不刺眼；
> 调整只改 `themes.css` 一个文件。

## 新增一册的步骤

1. `vite.config.mts` 的 `rollupOptions.input` 登记新入口 `bN-xxx.html`
2. 根目录新建 `bN-xxx.html`，`<html data-volume="bN">`，script 指向
   `src/pages/bN-xxx/main.ts`（复制 risk-math 的 main.ts，样式导入相同）
3. `src/pages/bN-xxx/` 下写页面骨架与章节组件，章节模板如下
4. 首页 `Home.vue` 的 `volumes` 数组把该册置为 `live` 并给链接

## 章节模板（页面内复用组件）

```vue
<script setup lang="ts">
import Callout from '@/shared/components/Callout.vue';
import ChapterHead from '@/shared/components/ChapterHead.vue';
import GoalsCard from '@/shared/components/GoalsCard.vue';
import OpeningBox from '@/shared/components/OpeningBox.vue';
import QuizItem from '@/shared/components/QuizItem.vue';
</script>

<template>
  <section id="cXX" class="section">
    <ChapterHead tag="§N · 对应 B3-CXX" src="全章约 X,XXX 字 · 算例 EX-*">
      <h2>章节标题</h2>
    </ChapterHead>

    <OpeningBox><!-- 开场问题，若干 <p> --></OpeningBox>
    <Callout variant="key" title="一句话结论"><p>…</p></Callout>
    <GoalsCard><ol class="goals-list"><li>…</li></ol></GoalsCard>

    <h3 id="cXX-s1" class="sub-title" data-spy>一、小节标题</h3>
    <!-- 正文：.formula-block / table.data-table / 交互组件 / .table-note -->

    <h3 id="cXX-m" class="sub-title" data-spy>常见误区</h3>
    <Callout variant="warn" title="误区一：…"><p>…</p></Callout>

    <h3 id="cXX-z" class="sub-title" data-spy>自测题</h3>
    <QuizItem>
      <template #q>题面</template>
      <template #a><p><span class="ans-label">答案与解析：</span>…</p></template>
    </QuizItem>

    <h3 id="cXX-c" class="sub-title" data-spy>速查卡</h3>
    <div class="cheat-card">…</div>
  </section>
</template>
```

侧栏目录在页面骨架里登记（`toc` 数组：章 id + 小节 id），滚动高亮与折叠自动生效。

## 共享组件清单

| 组件 | 用途 |
|---|---|
| `SideNav.vue` | 侧栏：双级目录、章节折叠（点箭头或点章节名收纳）、整栏收纳（«/»，记忆在 localStorage）、滚动高亮自动展开 |
| `Callout.vue` | 提示框，variant：key（结论）/ tip / warn（误区）/ danger（边界） |
| `RiskNotice.vue` | 全书统一风险提示框 |
| `ChapterHead.vue` | 章节头（编号 tag + 标题 + 来源行） |
| `OpeningBox.vue` | 开场问题框 |
| `GoalsCard.vue` | 本章学习目标卡 |
| `QuizItem.vue` | 自测题折叠卡（#q 题面 / #a 解析） |

交互组件（目前册三）：`RecoverCurve`（回本曲线）、`PositionCalculator`（六步走仓位计算器）、
`ExpectancyExplorer`（期望值探索器）、`DrawdownStreak`（连亏回撤）、`GapConstraint`（最坏跳空约束）。

## 约定（继承原书红线）

- 图表配色不使用红绿暗示盈亏；红色仅用于"禁止/停手"语义，黄色仅用于警示
- 所有参考值标注"起步参考值，需个人校准"；规则/费率/税款数值保留【待核验】标注
- 计算器组件必须明示"只是把输入代入公式做算术演示，不构成投资建议"
