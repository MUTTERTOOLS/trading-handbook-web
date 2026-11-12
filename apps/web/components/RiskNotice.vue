<script setup lang="ts">
defineProps<{
  /** 用章节自带的 HTML 替换默认风险提示；不传则使用全站默认文案 */
  text?: string;
  extra?: string;
}>();
</script>

<template>
  <div class="risk-notice" role="note">
    <div class="rn-title">⚠️ 风险提示</div>
    <div v-if="text" class="rn-text" v-html="text"></div>
    <p v-else>本章内容不预测价格，不保证任何方法有效。任何方法在投入资金前，都须经过验证并以你能承受的亏损为限。</p>
    <p v-if="extra">{{ extra }}</p>
    <slot />
  </div>
</template>
