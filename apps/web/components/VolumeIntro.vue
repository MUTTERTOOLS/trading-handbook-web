<script setup lang="ts">
import { computed } from 'vue';
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
    cutoffDate: string;
    volumes: VolumeMeta[];
  };
}

const { params, theme } = useData();
const { series } = theme.value as unknown as ThemeWithSeries;

const volume = computed(
  () => series.volumes.find((item) => item.slug === params.value?.volume) ?? series.volumes[0]!
);
const CN_NUM: Record<string, string> = {
  B1: '一', B2: '二', B3: '三', B4: '四',
  B5: '五', B6: '六', B7: '七', B8: '八',
};
const cnNumber = computed(() => CN_NUM[volume.value.id] ?? volume.value.id);
const firstChapterHref = computed(() => `/${volume.value.slug}/${volume.value.id.toLowerCase()}-c01.html`);
</script>

<template>
  <div class="volume-header">
    <div class="volume-badge">册{{ cnNumber }}《{{ volume.title }}》· 全册主题页</div>
    <h1 class="accent-gradient-text">{{ volume.title }}</h1>
    <p class="volume-subtitle">
      全册 {{ volume.expectedChapters }} 章。{{ volume.description }}
    </p>
    <div class="volume-stats">
      <div class="volume-stat">
        <div class="label">收录范围</div>
        <div class="value">{{ volume.id }} · 全部 {{ volume.expectedChapters }} 章</div>
      </div>
      <div class="volume-stat">
        <div class="label">开始阅读</div>
        <div class="value"><a :href="firstChapterHref">从第 1 章进入 →</a></div>
      </div>
      <div class="volume-stat">
        <div class="label">截稿基线</div>
        <div class="value">{{ series.cutoffDate }}</div>
      </div>
    </div>
    <p class="volume-meta">
      章节列表见下方目录；每章正文、误区、自测题与交互组件均嵌入原文。
    </p>
  </div>
</template>
