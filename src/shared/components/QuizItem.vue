<script setup lang="ts">
// 自测题折叠卡：#q 为题面，#a 为答案与解析
</script>

<template>
  <details class="quiz">
    <summary><slot name="q" /></summary>
    <div class="quiz-body"><slot name="a" /></div>
  </details>
</template>
