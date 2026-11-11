<script setup lang="ts">
import { computed } from 'vue';
import type { Block, Chapter, WidgetPlacement } from '@trading-handbook/content-model';
import ChapterHead from '@/shared/components/ChapterHead.vue';
import BlockRenderer from './BlockRenderer.vue';
import WidgetHost from './WidgetHost.vue';

const props = defineProps<{
  chapter: Chapter;
  index: number;
  widgets: WidgetPlacement[];
}>();

/** 组件只插在正文顶层区块之后；section 的聚合文本会重复命中，必须排除 */
const ANCHOR_BLOCK_TYPES = new Set<Block['type']>([
  'paragraph',
  'list',
  'table',
  'blockquote',
  'figure',
  'heading',
]);

const placements = computed(() => {
  const map = new Map<number, WidgetPlacement[]>();
  const used = new Set<string>();
  props.chapter.blocks.forEach((block, blockIndex) => {
    if (!ANCHOR_BLOCK_TYPES.has(block.type)) return;
    const text = block.text ?? '';
    const matches = props.widgets.filter(
      (placement) => !used.has(placement.id) && text.includes(placement.afterText)
    );
    if (matches.length) {
      map.set(blockIndex, matches);
      for (const placement of matches) used.add(placement.id);
    }
  });
  return map;
});

function widgetsAfter(blockIndex: number): WidgetPlacement[] {
  return placements.value.get(blockIndex) ?? [];
}

const sourceNote = computed(() => {
  const parts = [`全章约 ${props.chapter.stats.chars.toLocaleString('zh-CN')} 字`];
  if (props.chapter.meta.constants_used.length) {
    parts.push(`统一算例 ${props.chapter.meta.constants_used.join(' / ')}`);
  }
  if (props.chapter.stats.figures) {
    parts.push(`图示 ${props.chapter.stats.figures}`);
  }
  if (props.chapter.stats.verify) {
    parts.push(`待核验 ${props.chapter.stats.verify}`);
  }
  return parts.join(' · ');
});
</script>

<template>
  <section :id="chapter.id" class="section chapter">
    <ChapterHead :tag="`§${index} · 对应 ${chapter.id}`" :src="sourceNote">
      <h2>{{ chapter.title }}</h2>
    </ChapterHead>

    <template v-for="(block, blockIndex) in chapter.blocks" :key="blockIndex">
      <BlockRenderer :block="block" />
      <WidgetHost
        v-for="(placement, placementIndex) in widgetsAfter(blockIndex)"
        :key="`${placement.id}-${placementIndex}`"
        :id="placement.id"
        :params="placement.params"
      />
    </template>
  </section>
</template>
