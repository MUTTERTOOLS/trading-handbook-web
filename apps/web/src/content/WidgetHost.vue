<script setup lang="ts">
import { computed, type Component } from 'vue';
import { widgetMap } from '@/widgets';

const props = defineProps<{
  id: string;
  params?: Record<string, unknown>;
}>();

const component = computed<Component | null>(() => widgetMap[props.id] ?? null);

if (!widgetMap[props.id]) {
  console.warn(`[content] 未注册的交互组件：${props.id}`);
}
</script>

<template>
  <component :is="component" v-if="component" v-bind="params" />
</template>
