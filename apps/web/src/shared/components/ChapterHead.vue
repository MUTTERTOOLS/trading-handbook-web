<script setup lang="ts">
defineProps<{ tag: string; src: string }>();
</script>

<template>
  <div class="section-head">
    <div class="section-tag">{{ tag }}</div>
    <h2><slot /></h2>
    <div class="section-src">{{ src }}</div>
  </div>
</template>
