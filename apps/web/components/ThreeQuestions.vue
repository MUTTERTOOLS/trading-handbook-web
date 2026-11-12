<script setup lang="ts">
import { ref, computed } from 'vue';

/** 三问：期望能否论证 / 风险是否可控 / 规则是否事先写下（B1-C01） */
type Answer = 'yes' | 'no' | null;
const q1 = ref<Answer>(null);
const q2 = ref<Answer>(null);
const q3 = ref<Answer>(null);

const answered = computed(() => q1.value !== null && q2.value !== null && q3.value !== null);
/** 三问缺一不可：任何一问答不上，即归入赌博式操作 */
const pass = computed(() => answered.value && q1.value === 'yes' && q2.value === 'yes' && q3.value === 'yes');
/** 未过的问项，用于结论文案 */
const failedList = computed(() => {
  const failed: string[] = [];
  if (q1.value === 'no') failed.push('期望能否论证');
  if (q2.value === 'no') failed.push('风险是否可控');
  if (q3.value === 'no') failed.push('规则是否事先写下');
  return failed.join('、');
});

const questions = [
  { key: 'q1', text: '期望能否论证', hint: '我赚的是什么钱？能不能讲出道理或用数据验证？' },
  { key: 'q2', text: '风险是否可控', hint: '最多亏多少？这个数是动手前定的吗？极端情况有预案吗？' },
  { key: 'q3', text: '规则是否事先写下', hint: '入场、退出、单笔亏损额度，在纸上吗？' },
] as const;

function setAnswer(key: 'q1' | 'q2' | 'q3', v: Answer) {
  if (key === 'q1') q1.value = v;
  else if (key === 'q2') q2.value = v;
  else q3.value = v;
}
const answerOf = (key: 'q1' | 'q2' | 'q3'): Answer =>
  key === 'q1' ? q1.value : key === 'q2' ? q2.value : q3.value;

/** 原书自测题 2 的三个情景 + 正文样本，作预设 */
interface Sample {
  name: string;
  desc: string;
  a: [Answer, Answer, Answer];
}
const samples: Sample[] = [
  { name: '样本一', desc: '写明入场、止损与额度，来源论证过', a: ['yes', 'yes', 'yes'] },
  { name: '样本二', desc: '亏损额度清楚，但依据是群里的名单', a: ['no', 'yes', 'yes'] },
  { name: '样本三', desc: '打算拿十年，但没有任何退出与检查安排', a: ['no', 'no', 'no'] },
];
function applySample(s: Sample) {
  q1.value = s.a[0];
  q2.value = s.a[1];
  q3.value = s.a[2];
}
</script>

<template>
  <div class="calc-widget">
    <div class="widget-title">三问尺子 · 给一个做法归类</div>
    <p class="widget-desc">
      三问判断的是"做法"，不看标的、不看时长、不看这个人；三问缺一不可。
      答不上任何一问，先不动手。三问全过，也只是"值得继续研究"，不等于能赚钱。
    </p>
    <div class="calc-grid" style="gap: 20px;">
      <div>
        <div v-for="q in questions" :key="q.key" class="tq-row">
          <div class="tq-head">
            <span class="tq-name">{{ q.text }}</span>
            <span class="tq-hint">{{ q.hint }}</span>
          </div>
          <div class="tq-opts" role="group" :aria-label="q.text">
            <button
              type="button"
              class="tq-btn"
              :class="{ on: answerOf(q.key) === 'yes' }"
              :aria-pressed="answerOf(q.key) === 'yes'"
              @click="setAnswer(q.key, 'yes')"
            >能论证 / 过</button>
            <button
              type="button"
              class="tq-btn"
              :class="{ off: answerOf(q.key) === 'no' }"
              :aria-pressed="answerOf(q.key) === 'no'"
              @click="setAnswer(q.key, 'no')"
            >答不上 / 不过</button>
          </div>
        </div>
        <div class="preset-row" role="group" aria-label="载入正文样本">
          <button
            v-for="s in samples"
            :key="s.name"
            type="button"
            class="preset-btn"
            @click="applySample(s)"
          >
            <strong>{{ s.name }}</strong>
            {{ s.desc }}
          </button>
        </div>
      </div>
      <div>
        <div class="result-box" :class="{ blocked: answered && !pass }" aria-live="polite">
          <template v-if="!answered">
            <div class="result-value" style="font-size: 18px;">逐问作答后出结论</div>
            <div class="result-label">归类针对的是"做法"，不是"这个人"</div>
          </template>
          <template v-else-if="pass">
            <div class="result-value">投资或交易</div>
            <div class="result-label">三问全过——方法仍需验证（〔B1-C03〕与册六），分类只说明做法上有讨论的基础</div>
          </template>
          <template v-else>
            <div class="result-value">赌博式操作</div>
            <div class="result-reason">「{{ failedList }}」答不上——三问缺一不可，先不动手。</div>
          </template>
        </div>
        <p class="table-note" style="text-align: center; margin-top: 10px;">
          归类会变：补上止损与额度、把"总会回来的"换成书面的退出条件，才可能从赌博式操作变成交易。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tq-row { margin-bottom: 14px; }
.tq-head { margin-bottom: 6px; }
.tq-name { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-right: 8px; }
.tq-hint { font-size: 12px; color: var(--text-muted); }
.tq-opts { display: flex; gap: 8px; }
.tq-btn {
  flex: 1;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--bg-card-alt);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s;
}
.tq-btn:hover { color: var(--text-primary); }
.tq-btn.on {
  border-color: rgba(59, 130, 246, 0.45);
  background: var(--blue-dim);
  color: var(--blue);
}
.tq-btn.off {
  border-color: rgba(234, 179, 8, 0.45);
  background: var(--yellow-dim);
  color: var(--yellow);
}
</style>
