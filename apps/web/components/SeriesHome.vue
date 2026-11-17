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
  chapters: String(volume.expectedChapters).padStart(2, '0'),
  href: `/${volume.slug}.html`,
  theme: volume.theme,
}));

/** 刊头期号：数据截止月（series.yaml cutoffDate → YYYY-MM） */
const edition = `INTERACTIVE EDITION · ${series.cutoffDate.slice(0, 7)}`;

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
    <header class="sh-masthead">
      <span class="sh-kicker">{{ series.title }}</span>
      <span class="sh-issue">{{ edition }}</span>
    </header>

    <section class="sh-hero">
      <h1 class="sh-oversize">风险，<em>先于方法</em></h1>
      <div class="sh-dek">
        <p class="sh-lead">
          {{ series.totals.volumes }} 册、{{ series.totals.chapters }} 章，从市场规则到执行复盘。先建立"会亏多少"的刻度，再谈怎么赚。
        </p>
        <p class="sh-stats">
          <b>{{ series.totals.volumes }}</b> 册 · <b>{{ series.totals.chapters }}</b> 章 · 全部上线
        </p>
      </div>
    </section>

    <nav class="sh-toc" aria-label="丛书目录">
      <div class="sh-toc-head">
        <h2>丛书目录</h2>
        <span>按阅读顺序 · CATALOGUE</span>
      </div>
      <a
        v-for="volume in volumes"
        :key="volume.id"
        class="sh-row"
        :href="volume.href"
        :style="`--v: var(--v-${volume.theme})`"
      >
        <span class="sh-no">{{ volume.cn }}</span>
        <span class="sh-main">
          <span class="sh-name">{{ volume.name }}</span>
          <span class="sh-desc">{{ volume.description }}</span>
        </span>
        <span class="sh-meta">
          <span class="sh-ch-line"><span class="sh-ch">{{ volume.chapters }}</span> 章</span>
          <span class="sh-id">{{ volume.id }}</span>
        </span>
      </a>
    </nav>

    <section class="sh-ability">
      <h2 class="sh-ability-title">读完这套书，你应当能<small>WHAT YOU WILL BE ABLE TO DO</small></h2>
      <ol class="sh-ability-list">
        <li v-for="step in abilityChain" :key="step.text">
          <b>{{ step.text }}</b><span>{{ step.src }}</span>
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
