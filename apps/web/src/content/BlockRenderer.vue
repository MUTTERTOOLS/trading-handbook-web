<script setup lang="ts">
import type { Block } from '@trading-handbook/content-model';
import Callout from '@/shared/components/Callout.vue';
import GoalsCard from '@/shared/components/GoalsCard.vue';
import OpeningBox from '@/shared/components/OpeningBox.vue';
import QuizItem from '@/shared/components/QuizItem.vue';
import RiskNotice from '@/shared/components/RiskNotice.vue';
import WidgetHost from './WidgetHost.vue';

defineOptions({ name: 'BlockRenderer' });

defineProps<{ block: Block }>();

function isFormula(block: Block): boolean {
  if (block.type !== 'blockquote') return false;
  const text = block.text ?? '';
  return text.length < 220 && /[=＝]/.test(text);
}

function paragraphClass(block: Block): string | undefined {
  if (block.type !== 'paragraph') return undefined;
  return /^(注|表注)[：:]/.test(block.text ?? '') ? 'table-note' : undefined;
}
</script>

<template>
  <template v-if="block.type === 'heading'">
    <h3 v-if="block.depth === 3" :id="block.id" class="sub-title" data-spy v-html="block.html"></h3>
    <h4 v-else :id="block.id" class="sub-sub-title" data-spy v-html="block.html"></h4>
  </template>

  <p
    v-else-if="block.type === 'paragraph'"
    :class="paragraphClass(block)"
    v-html="block.html"
  ></p>

  <div v-else-if="block.type === 'list'" class="md-list" v-html="block.html"></div>

  <div v-else-if="block.type === 'table'" class="table-scroll" v-html="block.html"></div>

  <blockquote
    v-else-if="block.type === 'blockquote'"
    :class="isFormula(block) ? 'formula-block' : 'quote-block'"
    v-html="block.html"
  ></blockquote>

  <div v-else-if="block.type === 'code'" class="code-block" v-html="block.html"></div>

  <div v-else-if="block.type === 'html'" v-html="block.html"></div>

  <hr v-else-if="block.type === 'hr'" />

  <Callout
    v-else-if="block.type === 'callout'"
    :variant="block.variant"
    :title="block.title"
  >
    <BlockRenderer v-for="(child, index) in block.blocks" :key="index" :block="child" />
  </Callout>

  <OpeningBox v-else-if="block.type === 'opening'">
    <BlockRenderer v-for="(child, index) in block.blocks" :key="index" :block="child" />
  </OpeningBox>

  <GoalsCard v-else-if="block.type === 'goals'">
    <ol class="goals-list">
      <li v-for="(item, index) in block.items" :key="index" v-html="item"></li>
    </ol>
  </GoalsCard>

  <QuizItem v-else-if="block.type === 'quiz'">
    <template #q>
      <div class="quiz-question" v-html="block.questionHtml"></div>
    </template>
    <template #a>
      <BlockRenderer
        v-for="(child, index) in block.answerBlocks"
        :key="index"
        :block="child"
      />
    </template>
  </QuizItem>

  <ol v-else-if="block.type === 'summary'" class="summary-list">
    <li v-for="(item, index) in block.items" :key="index" v-html="item"></li>
  </ol>

  <div v-else-if="block.type === 'cheat'" class="cheat-card" v-html="block.html"></div>

  <ul v-else-if="block.type === 'links'" class="links-list">
    <li v-for="(item, index) in block.items" :key="index" v-html="item"></li>
  </ul>

  <RiskNotice v-else-if="block.type === 'risk'" :text="block.html" />

  <details v-else-if="block.type === 'figure'" class="figure-note">
    <summary>图示说明（制作提示，读者可跳过）</summary>
    <div v-html="block.specHtml"></div>
  </details>

  <WidgetHost
    v-else-if="block.type === 'widget'"
    :id="block.id"
    :params="block.params"
  />

  <section v-else-if="block.type === 'section'" class="section-block">
    <h3 v-if="block.title" :id="block.id" class="sub-title" data-spy>{{ block.title }}</h3>
    <BlockRenderer
      v-for="(child, index) in block.blocks"
      :key="index"
      :block="child"
    />
  </section>
</template>
