<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

<template>
  <div class="cheat-card goals">
    <div class="cc-title">{{ title ?? '本章学习目标' }}</div>
    <slot />
  </div>
</template>
