<script setup lang="ts">
defineProps<{ label?: string }>();
</script>

<template>
  <div class="opening">
    <div class="op-label">{{ label ?? '开场问题' }}</div>
    <slot />
  </div>
</template>
