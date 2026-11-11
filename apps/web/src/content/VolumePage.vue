<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { SeriesData, VolumeContent } from '@trading-handbook/content-model';
import SideNav from '@/shared/components/SideNav.vue';
import type { NavGroup } from '@/shared/components/nav';
import RiskNotice from '@/shared/components/RiskNotice.vue';
import ChapterRenderer from './ChapterRenderer.vue';
import { edition } from './index';

const props = defineProps<{
  volume: VolumeContent;
  series: SeriesData;
}>();

const CN_NUM: Record<string, string> = {
  B1: '一',
  B2: '二',
  B3: '三',
  B4: '四',
  B5: '五',
  B6: '六',
  B7: '七',
  B8: '八',
};

const chapters = computed(() => props.volume.chapters);
const currentVolumeId = computed(() => props.volume.volume.id);
const cnNumber = computed(() => CN_NUM[currentVolumeId.value] ?? currentVolumeId.value);
const charsWan = computed(() => (props.volume.stats.chars / 10000).toFixed(1));
const widgetCount = computed(() =>
  chapters.value.reduce((sum, chapter) => sum + (edition[chapter.id]?.length ?? 0), 0)
);

const toc = computed(() =>
  chapters.value.map((chapter, index) => ({
    id: chapter.id,
    label: `§${index + 1} ${chapter.title}`,
    subs: chapter.toc.map((item) => ({ id: item.id, label: item.label })),
  }))
);

const activeId = ref(toc.value[0]?.id ?? '');
let lastRun = 0;

function updateSpy() {
  let current = toc.value[0]?.id ?? '';
  for (const chapter of toc.value) {
    for (const id of [chapter.id, ...chapter.subs.map((sub) => sub.id)]) {
      const element = document.getElementById(id);
      if (element && element.getBoundingClientRect().top <= 150) current = id;
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
    items: toc.value.map((chapter) => ({
      label: chapter.label,
      href: `#${chapter.id}`,
      active: activeId.value === chapter.id,
      children: chapter.subs.map((sub) => ({
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
      ...props.series.volumes.map((volume) => ({
        label: `${volume.id} ${volume.title}${volume.id === currentVolumeId.value ? '（本页）' : ''}`,
        href: `./${volume.slug}.html`,
        active: volume.id === currentVolumeId.value,
      })),
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
      <header class="volume-header">
        <div class="volume-badge">
          册{{ cnNumber }}《{{ volume.volume.title }}》· 全册主题页
        </div>
        <h1 class="accent-gradient-text">{{ volume.volume.title }}</h1>
        <p class="volume-subtitle">
          全册 {{ chapters.length }} 章全文 · 约 {{ charsWan }} 万字。{{ volume.volume.description }}
        </p>
        <div class="volume-stats">
          <div class="volume-stat">
            <div class="label">收录范围</div>
            <div class="value">{{ currentVolumeId }} · 全部 {{ chapters.length }} 章</div>
          </div>
          <div class="volume-stat">
            <div class="label">交互组件</div>
            <div class="value">{{ widgetCount }} 个 · 嵌入原文</div>
          </div>
          <div class="volume-stat">
            <div class="label">配套内容</div>
            <div class="value">误区 ×{{ volume.stats.misconceptions }} · 自测题 ×{{ volume.stats.quizzes }}</div>
          </div>
        </div>
        <p class="volume-meta">
          图示 {{ volume.stats.figures }} · 待核验 {{ volume.stats.verify }} ·
          交互图表是对原文"绘图说明"的实现
        </p>
      </header>

      <ChapterRenderer
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        :chapter="chapter"
        :index="index + 1"
        :widgets="edition[chapter.id] ?? []"
      />

      <footer>
        <div class="source-note">
          本页收录《{{ series.title }}》册{{ cnNumber }}《{{ volume.volume.title }}》全部
          {{ chapters.length }} 章全文，数字与原书统一算例一致，可按公式验算；
          交互图表是对原文"绘图说明"的实现。示例账户、标的与人物均为虚构；
          〔B?〕为原书章节交叉引用。所有"起步参考值"均需结合个人资金期限与承受能力校准；
          涉及交易规则、费率、税款的数值在原书中以【待核验】标注，发布前须经官方来源核验。
        </div>
        <RiskNotice
          :text="series.riskNotice"
          extra="网页中的计算器与图表只是把你输入的数字代入原书公式做算术演示，不构成任何投资建议。"
        />
      </footer>
    </div>
  </main>
</template>
