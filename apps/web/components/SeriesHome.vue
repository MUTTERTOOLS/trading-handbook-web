<script setup lang="ts">
import { useData, withBase } from 'vitepress';

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

/** 目录编号（D23）：弃汉字序号，按阅读顺序 01~08（mono + 册色）。
 *  href 经 withBase 补前缀：这里是原生 <a>（不走主题 VPLink），
 *  构建期 HTML 与无 JS 场景都要能直出正确的子路径（Pages 部署 base 非根） */
const volumes = series.volumes.map((volume, index) => ({
  id: volume.id,
  no: String(index + 1).padStart(2, '0'),
  name: volume.title,
  description: volume.description,
  chapters: String(volume.expectedChapters).padStart(2, '0'),
  href: withBase(`/${volume.slug}.html`),
  theme: volume.theme,
}));

/** 刊头期号：数据截止月（series.yaml cutoffDate → YYYY-MM） */
const edition = `INTERACTIVE EDITION · ${series.cutoffDate.slice(0, 7)}`;

/** 读完这套书应具备的能力链（阅读顺序，内容侧既有文案；册引用随 D23 改 B 编号） */
const abilityChain = [
  { text: '能看懂市场规则', src: 'B2' },
  { text: '能算出每笔最多亏多少、买多少', src: 'B3' },
  { text: '能判断一个方法是有效还是运气', src: 'B6' },
  { text: '能按规则执行并复盘', src: 'B7' },
  { text: '能拆解和选择一个门派', src: 'B8' },
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
      <div class="sh-cards">
        <a
          v-for="volume in volumes"
          :key="volume.id"
          class="sh-card"
          :href="volume.href"
          :style="`--v: var(--v-${volume.theme})`"
        >
          <span class="sh-card-no">{{ volume.no }}</span>
          <span class="sh-card-body">
            <span class="sh-card-title-row">
              <span class="sh-card-name">{{ volume.name }}</span>
              <span class="sh-card-meta">{{ volume.chapters }} 章 · {{ volume.id }}</span>
            </span>
            <span class="sh-card-desc">{{ volume.description }}</span>
          </span>
        </a>
      </div>
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
