<script setup lang="ts">
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

interface ChapterMeta {
  no: number;
  title: string;
  href: string;
}
interface VolumeMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: string;
  expectedChapters: number;
  chapters: ChapterMeta[];
}
interface ThemeWithSeries {
  series: {
    cutoffDate: string;
    riskNotice: string;
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
/* 章目录 href 来自 config（/b{n}/c{nn}.html 绝对路径）：原生 <a> 不经框架
 * base 重写（客户端路由按 baseURI 解析，缺前缀会跳到根路径 404），这里显式 withBase */
</script>

<template>
  <div class="volume-page">
    <span class="vp-badge">册{{ cnNumber }} · 全册 {{ volume.expectedChapters }} 章</span>
    <h1 class="vt-title">{{ volume.title }}</h1>
    <p class="vt-lede">{{ volume.description }}</p>

    <nav class="vt-catalog" aria-label="本章目录">
      <a
        v-for="chapter in volume.chapters"
        :key="chapter.no"
        class="vt-row"
        :href="withBase(chapter.href)"
      >
        <span class="vt-no tabular">§{{ String(chapter.no).padStart(2, '0') }}</span>
        <span class="vt-name">{{ chapter.title }}</span>
      </a>
    </nav>

    <!-- 本册规则内容时效说明（F-015①）：分册落地页此前零截稿/核验文本；
         数据源与 SeriesHome 同源（config themeConfig.series 的 cutoffDate 与 riskNotice），
         置于册名/章目录之后的留白处，淡色小卡 -->
    <aside class="vt-sema" role="note">
      <p class="vt-sema-main">
        本册规则类内容的截稿基准：<b>{{ series.cutoffDate }}</b
        >。各章章首标注该章截稿日期，核验表说明见各章。
      </p>
      <p class="vt-sema-sub">{{ series.riskNotice }}</p>
    </aside>
  </div>
</template>
