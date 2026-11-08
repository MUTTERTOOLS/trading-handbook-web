<script setup lang="ts">
defineProps<{
  variant: 'key' | 'tip' | 'warn' | 'danger';
  title: string;
}>();
</script>

<template>
  <div class="callout" :class="`callout-${variant}`">
    <div class="callout-title">{{ title }}</div>
    <slot />
  </div>
</template>
