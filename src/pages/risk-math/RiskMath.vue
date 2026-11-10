<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import SideNav from '@/shared/components/SideNav.vue';
import type { NavGroup } from '@/shared/components/nav';
import RiskNotice from '@/shared/components/RiskNotice.vue';
import ChapterOne from './components/ChapterOne.vue';
import ChapterTwo from './components/ChapterTwo.vue';
import ChapterThree from './components/ChapterThree.vue';
import ChapterFour from './components/ChapterFour.vue';
import ChapterFive from './components/ChapterFive.vue';
import ChapterSix from './components/ChapterSix.vue';
import ChapterSeven from './components/ChapterSeven.vue';
import ChapterEight from './components/ChapterEight.vue';
import ChapterNine from './components/ChapterNine.vue';
import ChapterTen from './components/ChapterTen.vue';
import ChapterEleven from './components/ChapterEleven.vue';
import ChapterTwelve from './components/ChapterTwelve.vue';

/* ---- 目录数据：章 + 小节两级 ---- */
interface TocSub {
  id: string;
  label: string;
}
interface TocChapter {
  id: string;
  label: string;
  subs: TocSub[];
}
function chapter(id: string, label: string, subs: TocSub[]): TocChapter {
  return {
    id,
    label,
    subs: [
      ...subs,
      { id: `${id}-m`, label: '常见误区' },
      { id: `${id}-z`, label: '自测题' },
      { id: `${id}-c`, label: '速查卡' },
    ],
  };
}

const toc: TocChapter[] = [
  chapter('c01', '§1 亏损的非对称数学', [
    { id: 'c01-s1', label: '一、为什么涨 20% 回不来' },
    { id: 'c01-s2', label: '二、波动怎么"偷"走钱' },
    { id: 'c01-s3', label: '三、大亏对终值的破坏' },
    { id: 'c01-s4', label: '四、深亏的代价是时间' },
  ]),
  chapter('c02', '§2 破产是怎么发生的', [
    { id: 'c02-s1', label: '一、重仓单票与杠杆' },
    { id: 'c02-s2', label: '二、扛单与亏损加仓' },
    { id: 'c02-s3', label: '三、EX-J：小优势加大仓位' },
    { id: 'c02-s4', label: '四、共同的骨架' },
  ]),
  chapter('c03', '§3 决策顺序铁律', [
    { id: 'c03-s1', label: '一、同一根拉升，两种做法' },
    { id: 'c03-s2', label: '二、五步各做什么' },
    { id: 'c03-s3', label: '三、错误顺序的三种典型' },
    { id: 'c03-s4', label: '四、把五步装进一天' },
  ]),
  chapter('c04', '§4 单笔风险与仓位公式', [
    { id: 'c04-s1', label: '一、先定"最多亏多少"：1R' },
    { id: 'c04-s2', label: '二、由止损距离反推股数' },
    { id: 'c04-s3', label: '三、六步走（EX-B）' },
    { id: 'c04-s4', label: '四、买不起怎么办' },
    { id: 'c04-s5', label: '五、公式的边界' },
  ]),
  chapter('c05', '§5 止损的三种设置法', [
    { id: 'c05-s1', label: '一、止损价从哪里来' },
    { id: 'c05-s2', label: '二、结构位 / ATR / 固定百分比' },
    { id: 'c05-s3', label: '三、EX-D：同样的价格，不同的波动' },
    { id: 'c05-s4', label: '四、两种极端：太紧与太宽' },
  ]),
  chapter('c06', '§6 止损的局限：跳空与流动性缺失', [
    { id: 'c06-s1', label: '一、止损失效的三个情景' },
    { id: 'c06-s2', label: '二、计划亏损与实际亏损' },
    { id: 'c06-s3', label: '三、最坏跳空约束' },
    { id: 'c06-s4', label: '四、适用清单与事件窗口' },
    { id: 'c06-s5', label: '五、三个"最坏"之问' },
  ]),
  chapter('c07', '§7 组合风险：总敞口与相关性', [
    { id: 'c07-s1', label: '一、五只股票为什么像一只' },
    { id: 'c07-s2', label: '二、在途总风险：第二本账' },
    { id: 'c07-s3', label: '三、四个抓手找托盘' },
    { id: 'c07-s4', label: '四、EX-O 全程' },
    { id: 'c07-s5', label: '五、持仓登记表' },
  ]),
  chapter('c08', '§8 胜率、赔率、频率的配平', [
    { id: 'c08-s1', label: '一、两张战绩单' },
    { id: 'c08-s2', label: '二、盈亏平衡曲线' },
    { id: 'c08-s3', label: '三、成本与频率' },
    { id: 'c08-s4', label: '四、平均会掩盖尾部' },
  ]),
  chapter('c09', '§9 七种合法退出', [
    { id: 'c09-s1', label: '一、先写"什么时候走"' },
    { id: 'c09-s2', label: '二、退出①~⑤' },
    { id: 'c09-s3', label: '三、退出⑥⑦：账户与生活' },
    { id: 'c09-s4', label: '四、对应表与"套牢改长线"' },
  ]),
  chapter('c10', '§10 回撤熔断：什么时候该停手', [
    { id: 'c10-s1', label: '一、"连亏就停"靠不住' },
    { id: 'c10-s2', label: '二、连亏与回撤的分布' },
    { id: 'c10-s3', label: '三、硬上限 H 与熔断线' },
    { id: 'c10-s4', label: '四、反推仓位（EX-K）' },
    { id: 'c10-s5', label: '五、触发之后' },
  ]),
  chapter('c11', '§11 新手零杠杆与资金期限', [
    { id: 'c11-s1', label: '一、资金三层分层' },
    { id: 'c11-s2', label: '二、期限错配的代价' },
    { id: 'c11-s3', label: '三、零杠杆禁令' },
    { id: 'c11-s4', label: '四、解禁条件' },
  ]),
  chapter('c12', '§12 风控速查卡', [
    { id: 'c12-s1', label: '一、先顺序，后数字' },
    { id: 'c12-s2', label: '二、公式总表：8 条' },
    { id: 'c12-s3', label: '三、起步参考值总表' },
    { id: 'c12-s4', label: '四、熔断流程：四步走' },
    { id: 'c12-s5', label: '五、校准表与 9 项检查' },
  ]),
];

const activeId = ref('c01');
let lastRun = 0;

/** 滚动监听：取视口顶带（top ≤ 150px）之上最后一个标题，锚点跳转也能正确高亮。
 *  不用 requestAnimationFrame 节流（部分内嵌环境不触发 rAF），改用时间戳节流。 */
function updateSpy() {
  let current = toc[0]!.id;
  for (const ch of toc) {
    for (const id of [ch.id, ...ch.subs.map((s) => s.id)]) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 150) current = id;
    }
  }
  activeId.value = current;
}
function onScroll() {
  const now = performance.now();
  if (now - lastRun < 80) return;
  lastRun = now;
  updateSpy();
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('hashchange', updateSpy);
  // 带锚点刷新：Vue 挂载前锚点元素不存在，原生跳转会落空，这里补一次定位
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) {
    document.getElementById(hash)?.scrollIntoView({ block: 'start' });
  }
  updateSpy();
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('hashchange', updateSpy);
});

const navGroups = computed<NavGroup[]>(() => [
  {
    label: '全册目录',
    items: toc.map((ch) => ({
      label: ch.label,
      href: `#${ch.id}`,
      active: activeId.value === ch.id,
      children: ch.subs.map((sub) => ({
        label: sub.label,
        href: `#${sub.id}`,
        active: activeId.value === sub.id,
      })),
    })),
  },
  {
    label: '丛书页面',
    alt: true,
    items: [
      { label: '← 丛书总览', href: './index.html' },
      { label: 'B3 风控与资金管理（本页）', href: '#c01', active: true },
      { label: '其余 7 册 · 待网页化', href: '', disabled: true },
    ],
  },
]);
</script>

<template>
  <SideNav
    brand="新手交易系统化入门丛书"
    brand-sub="交互阅读版 · 网页化工程"
    :groups="navGroups"
  />

  <main id="main">
    <div class="container">
      <!-- 封面头部 -->
      <header style="padding: 24px 0 8px;">
        <div style="
          display: inline-block; padding: 6px 16px; border-radius: 20px;
          background: var(--accent-dim); color: var(--accent); font-size: 12px;
          font-weight: 600; letter-spacing: 1.5px; margin-bottom: 20px;
          border: 1px solid var(--border-accent);
        ">册三《风控与资金管理》· 全册主题页</div>
        <h1 class="accent-gradient-text" style="font-size: 44px; font-weight: 900; line-height: 1.2; margin-bottom: 14px;">
          风险数学
        </h1>
        <p style="font-size: 18px; color: var(--text-secondary); font-weight: 300; margin-bottom: 28px;">
          全册 12 章全文 · 约 5.6 万字。交互组件嵌在原文对应位置，全部数字与原书统一算例一致，可按公式验算。
        </p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">收录范围</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent);">B3 · 全部 12 章</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">交互组件</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent);">5 个 · 嵌入原文</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">配套内容</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent);">误区 ×35 · 自测题 ×56</div>
          </div>
        </div>
      </header>

      <!-- 章节组件文件名与 section id（c01~c12）一一对应，按序渲染 -->
      <ChapterOne />
      <ChapterTwo />
      <ChapterThree />
      <ChapterFour />
      <ChapterFive />
      <ChapterSix />
      <ChapterSeven />
      <ChapterEight />
      <ChapterNine />
      <ChapterTen />
      <ChapterEleven />
      <ChapterTwelve />

      <!-- 页脚 -->
      <footer>
        <div class="source-note">
          本页收录《新手交易系统化入门丛书》册三《风控与资金管理》全部 12 章全文，
          数字与原书统一算例（EX-A ~ EX-R）一致，可按公式验算；交互图表是对原文"绘图说明"的实现。
          示例账户、标的与人物均为虚构；〔B?〕为原书章节交叉引用。
          所有"起步参考值"均需结合个人资金期限与承受能力校准；涉及交易规则、费率、税款的数值在原书中以【待核验】标注，发布前须经官方来源核验。
        </div>
        <RiskNotice extra="网页中的计算器与图表只是把你输入的数字代入原书公式做算术演示，不构成任何投资建议。" />
      </footer>
    </div>
  </main>
</template>

<style scoped>
footer { margin-bottom: 0; }
@media (max-width: 640px) {
  header > div:last-child { grid-template-columns: 1fr 1fr !important; }
}
</style>
