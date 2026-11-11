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
  chapter('c01', '§1 交易、投资与赌博的边界', [
    { id: 'c01-s1', label: '一、同一笔 10 万的三种玩法' },
    { id: 'c01-s2', label: '二、区分三类的三个问题' },
    { id: 'c01-s3', label: '三、每一笔成交都有对手盘' },
    { id: 'c01-s4', label: '四、零和、正和、负和' },
    { id: 'c01-s5', label: '五、这把尺子管什么' },
  ]),
  chapter('c02', '§2 市场里的钱从哪里来', [
    { id: 'c02-s1', label: '一、先把两笔账分开' },
    { id: 'c02-s2', label: '二、五类收益来源' },
    { id: 'c02-s3', label: '三、说不清来源，就不采信' },
    { id: 'c02-s4', label: '四、这一章不能帮你做什么' },
  ]),
  chapter('c03', '§3 一道算术题：期望收益公式', [
    { id: 'c03-s1', label: '一、先把输赢换算成 R' },
    { id: 'c03-s2', label: '二、期望收益' },
    { id: 'c03-s3', label: '三、胜率与盈亏比的跷跷板' },
    { id: 'c03-s4', label: '四、E 大于零只是一张门票' },
  ]),
  chapter('c04', '§4 "5+1"信息分类', [
    { id: 'c04-s1', label: '一、一段口述' },
    { id: 'c04-s2', label: '二、六个字，逐个过' },
    { id: 'c04-s3', label: '三、检查表，不是定律' },
    { id: 'c04-s4', label: '四、把口述拆进六格' },
    { id: 'c04-s5', label: '五、怎么用、不能怎么用' },
  ]),
  chapter('c05', '§5 道、法、术：三层分工', [
    { id: 'c05-s1', label: '一、盖房子：地基、结构、装修' },
    { id: 'c05-s2', label: '二、三层各自负责什么' },
    { id: 'c05-s3', label: '三、分层是工程划分' },
    { id: 'c05-s4', label: '四、术的货架：九个衍生工具' },
    { id: 'c05-s5', label: '五、这张地图怎么用' },
  ]),
  chapter('c06', '§6 这套框架能做什么、不能做什么', [
    { id: 'c06-s1', label: '一、照妖镜与安全带' },
    { id: 'c06-s2', label: '二、框架不产生收益' },
    { id: 'c06-s3', label: '三、警惕"怎么都对"' },
    { id: 'c06-s4', label: '四、体检七问' },
    { id: 'c06-s5', label: '五、案例：拆《三步稳赚法》' },
  ]),
  chapter('c07', '§7 全丛书使用说明', [
    { id: 'c07-s1', label: '一、八册各管什么' },
    { id: 'c07-s2', label: '二、三条阅读路径' },
    { id: 'c07-s3', label: '三、三条使用声明' },
    { id: 'c07-s4', label: '四、速查卡与术语表' },
    { id: 'c07-s5', label: '五、免责声明' },
  ]),
];

const activeId = ref('c01');
let lastRun = 0;

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
      { label: 'B1 交易入门地图（本页）', href: '#c01', active: true },
      { label: 'B3 风控与资金管理', href: './risk-math.html' },
      { label: '其余 6 册 · 待网页化', href: '', disabled: true },
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
        ">册一《交易入门地图》· 全册主题页</div>
        <h1 class="accent-gradient-text" style="font-size: 44px; font-weight: 900; line-height: 1.2; margin-bottom: 14px;">
          交易入门地图
        </h1>
        <p style="font-size: 18px; color: var(--text-secondary); font-weight: 300; margin-bottom: 28px;">
          全册 7 章全文 · 约 3 万字。建预期、给框架：三问尺子、钱的来源、期望算术、信息分格、三层分工、体检七问、全书导航。
        </p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">收录范围</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent);">B1 · 全部 7 章</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">交互组件</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent);">2 个 · 嵌入原文</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">配套内容</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent);">误区 ×21 · 自测题 ×33</div>
          </div>
        </div>
      </header>

      <ChapterOne />
      <ChapterTwo />
      <ChapterThree />
      <ChapterFour />
      <ChapterFive />
      <ChapterSix />
      <ChapterSeven />

      <!-- 页脚 -->
      <footer>
        <div class="source-note">
          本页收录《新手交易系统化入门丛书》册一《交易入门地图》全部 7 章全文，
          数字与原书统一算例（EX-A ~ EX-G 等）一致，可按公式验算；交互图表是对原文"绘图说明"的实现。
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
