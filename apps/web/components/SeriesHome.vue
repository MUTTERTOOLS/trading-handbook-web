<script setup lang="ts">
import { useData } from 'vitepress';

interface VolumeMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: string;
  expectedChapters: number;
}
interface ThemeWithSeries {
  series: {
    title: string;
    riskNotice: string;
    cutoffDate: string;
    totals: { volumes: number; chapters: number; chars: number };
    volumes: VolumeMeta[];
  };
}

const { theme } = useData();
const { series } = theme.value as unknown as ThemeWithSeries;

const CN_NUM: Record<string, string> = {
  B1: '一', B2: '二', B3: '三', B4: '四',
  B5: '五', B6: '六', B7: '七', B8: '八',
};

const volumes = series.volumes.map((volume) => ({
  id: volume.id,
  cn: CN_NUM[volume.id] ?? volume.id,
  name: volume.title,
  description: volume.description,
  chapters: volume.expectedChapters,
  href: `/${volume.slug}.html`,
  theme: volume.theme,
}));

/** 读完这套书应具备的能力链（阅读顺序，内容侧既有文案） */
const abilityChain = [
  { text: '能看懂市场规则', src: '册二' },
  { text: '能算出每笔最多亏多少、买多少', src: '册三' },
  { text: '能判断一个方法是有效还是运气', src: '册六' },
  { text: '能按规则执行并复盘', src: '册七' },
  { text: '能拆解和选择一个门派', src: '册八' },
];
</script>

<template>
  <div class="series-home">
    <span class="sh-badge">丛书 · 交互阅读版</span>
    <h1 class="sh-hero">风险，先于方法</h1>
    <p class="sh-sub">
      全书 {{ series.totals.volumes }} 册 {{ series.totals.chapters }} 章 · 全部上线
    </p>

    <nav class="sh-catalog" aria-label="丛书目录">
      <a v-for="volume in volumes" :key="volume.id" class="sh-row" :href="volume.href">
        <span class="sh-row-main">
          <span class="sh-no">册{{ volume.cn }}</span>
          <span class="sh-name" :class="`mineral-${volume.theme}`">{{ volume.name }}</span>
        </span>
        <span class="sh-meta">{{ volume.chapters }} 章 · {{ volume.description }}</span>
      </a>
    </nav>

    <section class="sh-ability">
      <h2 class="sh-section-title">读完这套书，你应当能</h2>
      <ol class="sh-ability-list">
        <li v-for="step in abilityChain" :key="step.text">
          <strong>{{ step.text }}</strong>（{{ step.src }}）
        </li>
      </ol>
    </section>

    <p class="sh-sema">
      <span class="sh-chip" style="background: var(--red)"></span>红＝禁止／停手
      <span class="sh-chip" style="background: var(--yellow)"></span>黄＝警示
    </p>

    <footer class="sh-footnote" role="note">
      <div class="sh-footnote-title">⚠️ 风险提示</div>
      <p>{{ series.riskNotice }}</p>
    </footer>
  </div>
</template>
