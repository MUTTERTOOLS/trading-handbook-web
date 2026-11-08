<script setup lang="ts">
defineProps<{ extra?: string }>();
</script>

<template>
  <div class="risk-notice" role="note">
    <div class="rn-title">⚠️ 风险提示</div>
    <p>本章内容不预测价格，不保证任何方法有效。任何方法在投入资金前，都须经过验证并以你能承受的亏损为限。</p>
    <p v-if="extra">{{ extra }}</p>
    <slot />
  </div>
</template>
