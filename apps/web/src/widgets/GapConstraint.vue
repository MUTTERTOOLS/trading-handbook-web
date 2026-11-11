<script setup lang="ts">
import { ref, computed } from 'vue';

/** 演示本金固定为 EX-A 的 100,000 元 */
const PRINCIPAL = 100000;

/** 单笔风险比例（%），起步参考值 0.5~1，上限 2 */
const riskPct = ref(1);
/** 最坏跳空亏损幅度估计（%） */
const gapPct = ref(20);

/** 仓位占比上限 = 单笔风险比例 ÷ 最坏跳空幅度 */
const capPct = computed(() => (gapPct.value > 0 ? (riskPct.value / gapPct.value) * 100 : 0));
const capMoney = computed(() => Math.round((PRINCIPAL * capPct.value) / 100));
/** 最坏那天的亏损（应恰好等于 1R） */
const worstLoss = computed(() => Math.round((capMoney.value * gapPct.value) / 100));

function applyExc(): void {
  riskPct.value = 1;
  gapPct.value = 20;
}
</script>

<template>
  <div class="calc-widget">
    <div class="widget-title">最坏跳空约束计算器 · 把"最坏的那天"写进仓位</div>
    <p class="widget-desc">
      公式：仓位占比 ≤ 单笔风险比例 ÷ 最坏跳空亏损幅度（EX-C）。它回答的不是"正常止损那天亏多少"，
      而是"跳空越过止损价那天亏多少"。最坏幅度只能估计——看历史跳空记录、波动、事件临近与流动性（〔B4-C07〕），估不出就不重仓。
    </p>
    <div class="calc-grid" style="gap: 20px;">
      <div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="gc-risk">单笔风险比例</label>
            <span class="slider-val tabular">{{ riskPct.toFixed(2) }}%</span>
          </div>
          <input id="gc-risk" v-model.number="riskPct" type="range" min="0.25" max="2" step="0.05" aria-label="单笔风险比例" />
        </div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="gc-gap">最坏跳空亏损幅度（估计）</label>
            <span class="slider-val tabular">{{ gapPct }}%</span>
          </div>
          <input id="gc-gap" v-model.number="gapPct" type="range" min="5" max="40" step="1" aria-label="最坏跳空亏损幅度" />
        </div>
        <div class="preset-row" role="group" aria-label="载入统一算例">
          <button type="button" class="preset-btn" @click="applyExc">
            <strong>EX-C</strong>
            最坏 20% · 单笔 1%
          </button>
        </div>
      </div>
      <div>
        <div class="stat-grid cols-2" aria-live="polite">
          <div class="stat">
            <div class="stat-label">仓位占比上限</div>
            <div class="stat-value accent">{{ capPct.toFixed(2) }}%</div>
            <div class="stat-sub">{{ riskPct.toFixed(2) }}% ÷ {{ gapPct }}%</div>
          </div>
          <div class="stat">
            <div class="stat-label">本金 100,000 元 → 仓位上限</div>
            <div class="stat-value">{{ capMoney.toLocaleString('zh-CN') }} 元</div>
            <div class="stat-sub">与〔B3-C04〕其他约束取最严</div>
          </div>
        </div>
        <div class="result-box" aria-live="polite">
          <div class="result-value">{{ worstLoss.toLocaleString('zh-CN') }} 元</div>
          <div class="result-label">
            最坏那天按 {{ gapPct }}% 跳空卖出，亏损恰好等于 1R（{{ riskPct.toFixed(2) }}%）——仍在预算内
          </div>
        </div>
        <p class="table-note" style="text-align: center; margin-top: 10px;">
          仓位越大，跳空越贵：同样 −20% 的跳空，5% 仓位亏 1%，20% 仓位亏 4%，100% 仓位亏 20%。
        </p>
      </div>
    </div>
  </div>
</template>
