<script setup lang="ts">
import { ref, computed } from 'vue';

/**
 * 六步走仓位计算器（B3-C04 / EX-B）
 * 单票上限 20%、在途总风险上限 5%、单笔风险 0.5%~1%（上限 2%）
 * 均为原书"起步参考值"，需个人校准。
 */
const principal = ref(100000);
const riskPct = ref(1);
const entry = ref(10);
const stop = ref(9.5);
const buffer = ref(0.05);
const existingRisk = ref(3000);

interface Preset {
  name: string;
  desc: string;
  p: number; r: number; e: number; s: number; b: number; x: number;
}
const presets: Preset[] = [
  { name: 'EX-B 标准算例', desc: '六步全部通过', p: 100000, r: 1, e: 10, s: 9.5, b: 0.05, x: 3000 },
  { name: '止损很近的标的', desc: '被单票上限压住（自测题 2）', p: 100000, r: 1, e: 5, s: 4.8, b: 0, x: 0 },
  { name: '在途额度吃紧', desc: '在途总风险超限（自测题 5）', p: 100000, r: 1, e: 10, s: 9.5, b: 0.05, x: 4200 },
];
function applyPreset(t: Preset) {
  principal.value = t.p;
  riskPct.value = t.r;
  entry.value = t.e;
  stop.value = t.s;
  buffer.value = t.b;
  existingRisk.value = t.x;
}

const oneR = computed(() => (principal.value * riskPct.value) / 100);
const perShare = computed(() => Math.max(0, entry.value - stop.value + buffer.value));
const inputError = computed(
  () => entry.value <= 0 || stop.value < 0 || entry.value - stop.value <= 0 || principal.value <= 0
);
const rawShares = computed(() => (perShare.value > 0 ? oneR.value / perShare.value : 0));
/** 向下取整到 100 股（A 股主板最小交易单位，【待核验】） */
const shares = computed(() => Math.floor(rawShares.value / 100) * 100);
const invest = computed(() => shares.value * entry.value);
const posPct = computed(() => (principal.value > 0 ? (invest.value / principal.value) * 100 : 0));
const planLoss = computed(() => shares.value * perShare.value);
/** 单票上限压缩方案（起步参考值 20%，宽基 ETF 除外） */
const capShares = computed(() =>
  entry.value > 0 ? Math.floor((principal.value * 0.2) / entry.value / 100) * 100 : 0
);
/** 在途总风险（含本笔） */
const totalRisk = computed(() => existingRisk.value + planLoss.value);
const totalRiskPct = computed(() => (principal.value > 0 ? (totalRisk.value / principal.value) * 100 : 0));
/** 在途超限时，剩余额度可支撑的股数 */
const remainingQuota = computed(() => Math.max(0, principal.value * 0.05 - existingRisk.value));
const quotaShares = computed(() =>
  perShare.value > 0 ? Math.floor(remainingQuota.value / perShare.value / 100) * 100 : 0
);

const SINGLE_CAP = 20;
const TOTAL_CAP = 5;

const overCap = computed(() => posPct.value > SINGLE_CAP);
const overTotal = computed(() => totalRiskPct.value > TOTAL_CAP);
const noMinUnit = computed(() => !inputError.value && shares.value === 0);

const fmt = (n: number, digits = 2) =>
  n.toLocaleString('zh-CN', { maximumFractionDigits: digits });

const finalPass = computed(
  () => !inputError.value && !noMinUnit.value && !overCap.value && !overTotal.value
);

const finalReason = computed(() => {
  if (inputError.value) return '输入有误：止损价须低于入场价，本金与价格须为正数。';
  if (noMinUnit.value)
    return `公式股数不足 100 股，而最小单位 100 股需承担 ${fmt(100 * perShare.value, 0)} 元（超过 1R 的 ${fmt(oneR.value, 0)} 元）。按原书裁决：实际计划亏损大于 1R，一律不开仓。三条路：放弃这个标的 / 换同类低价标的或 ETF / 等本金增长。`;
  if (overCap.value && overTotal.value)
    return '单票占比与在途总风险同时超限。原书给的三条路：不开这笔 / 等某笔离场后再开 / 把这笔缩小——不能因为"机会太好"破例。';
  if (overCap.value)
    return `单票占比 ${fmt(posPct.value)}% 超过上限 ${SINGLE_CAP}%（止损很近的标的常被上限压住，而不是被 1R 压住）。按上限压缩至 ${capShares.value.toLocaleString('zh-CN')} 股后再校验其余步骤。`;
  if (overTotal.value)
    return `在途总风险 ${fmt(totalRiskPct.value)}% 超过上限 ${TOTAL_CAP}%。剩余额度约 ${fmt(remainingQuota.value, 0)} 元，缩小至 ${quotaShares.value.toLocaleString('zh-CN')} 股（实际计划亏损 ${fmt(quotaShares.value * perShare.value, 0)} 元）后可通过，或不开这笔。`;
  return '';
});
</script>

<template>
  <div class="calc-widget">
    <div class="widget-title">仓位计算器 · 六步走</div>
    <p class="widget-desc">
      它只做一件事：把你输入的数字代入原书公式，演示"先定最多亏多少，再算买多少"。
      所有默认值取自统一算例 EX-B；单笔风险 0.5%~1%（上限 2%）、单票上限 20%、在途总风险 5% 均为起步参考值，需个人校准。
    </p>

    <div class="calc-grid">
      <!-- 输入区 -->
      <div>
        <div class="input-group">
          <label for="pc-principal">账户本金（元）<span class="ref">· 下单当天盘前总权益</span></label>
          <input id="pc-principal" v-model.number="principal" type="number" min="1000" step="1000" />
        </div>
        <div class="input-group">
          <label for="pc-risk">单笔风险比例（%）<span class="ref">· 起步参考值 0.5~1，上限 2</span></label>
          <input id="pc-risk" v-model.number="riskPct" type="number" min="0.1" max="2" step="0.1" />
        </div>
        <div class="input-group">
          <label for="pc-entry">入场价（元）</label>
          <input id="pc-entry" v-model.number="entry" type="number" min="0.01" step="0.01" />
        </div>
        <div class="input-group">
          <label for="pc-stop">止损价（元）<span class="ref">· 来自买入逻辑失效的位置</span></label>
          <input id="pc-stop" v-model.number="stop" type="number" min="0" step="0.01" />
        </div>
        <div class="input-group">
          <label for="pc-buffer">滑点缓冲（元/股）<span class="ref">· 教学示意为 0.05，非推荐值</span></label>
          <input id="pc-buffer" v-model.number="buffer" type="number" min="0" step="0.01" />
        </div>
        <div class="input-group">
          <label for="pc-existing">已有持仓的计划亏损合计（元）<span class="ref">· 用于校验在途总风险</span></label>
          <input id="pc-existing" v-model.number="existingRisk" type="number" min="0" step="100" />
        </div>
        <div class="preset-row" role="group" aria-label="载入预设算例">
          <button
            v-for="t in presets"
            :key="t.name"
            type="button"
            class="preset-btn"
            @click="applyPreset(t)"
          >
            <strong>{{ t.name }}</strong>
            {{ t.desc }}
          </button>
        </div>
      </div>

      <!-- 六步结果区 -->
      <div>
        <div class="step-list" aria-live="polite">
          <div class="step-card pass">
            <span class="step-num">1</span>
            <div class="step-body">
              <div class="step-name">定 1R（这笔最多亏多少）</div>
              <div class="step-value">
                1R = {{ fmt(principal, 0) }} × {{ riskPct }}% = <strong>{{ fmt(oneR, 0) }} 元</strong>
              </div>
            </div>
          </div>
          <div class="step-card" :class="inputError ? 'fail' : 'pass'">
            <span class="step-num">2</span>
            <div class="step-body">
              <div class="step-name">定止损，算每股风险
                <span v-if="inputError" class="step-flag bad">输入有误</span>
              </div>
              <div class="step-value">
                {{ fmt(entry) }} − {{ fmt(stop) }} + {{ fmt(buffer) }} = <strong>{{ fmt(perShare) }} 元/股</strong>
              </div>
            </div>
          </div>
          <div class="step-card" :class="inputError ? 'fail' : 'pass'">
            <span class="step-num">3</span>
            <div class="step-body">
              <div class="step-name">算股数（含滑点）</div>
              <div class="step-value">
                {{ fmt(oneR, 0) }} ÷ {{ fmt(perShare) }} ≈ <strong>{{ rawShares.toFixed(0) }} 股</strong>
              </div>
            </div>
          </div>
          <div class="step-card" :class="noMinUnit || inputError ? 'fail' : 'pass'">
            <span class="step-num">4</span>
            <div class="step-body">
              <div class="step-name">向下取整到 100 股
                <span v-if="noMinUnit" class="step-flag bad">买不起</span>
              </div>
              <div class="step-value">
                取整 <strong>{{ shares.toLocaleString('zh-CN') }} 股</strong>，买入 {{ fmt(invest, 0) }} 元（占本金
                {{ fmt(posPct) }}%），实际最大计划亏损 <strong>{{ fmt(planLoss, 0) }} 元</strong>
              </div>
            </div>
          </div>
          <div class="step-card" :class="overCap || inputError || noMinUnit ? 'fail' : 'pass'">
            <span class="step-num">5</span>
            <div class="step-body">
              <div class="step-name">校验单票上限（≤ 20%）
                <span v-if="overCap" class="step-flag bad">超限</span>
                <span v-else-if="!inputError && !noMinUnit" class="step-flag ok">通过</span>
              </div>
              <div class="step-value">
                {{ fmt(posPct) }}% ≤ 20%
                <template v-if="overCap">—— 压缩方案：{{ capShares.toLocaleString('zh-CN') }} 股</template>
              </div>
            </div>
          </div>
          <div class="step-card" :class="overTotal || inputError || noMinUnit ? 'fail' : 'pass'">
            <span class="step-num">6</span>
            <div class="step-body">
              <div class="step-name">校验在途总风险（≤ 5%）
                <span v-if="overTotal" class="step-flag bad">超限</span>
                <span v-else-if="!inputError && !noMinUnit" class="step-flag ok">通过</span>
              </div>
              <div class="step-value">
                （{{ fmt(existingRisk, 0) }} + {{ fmt(planLoss, 0) }}）÷ {{ fmt(principal, 0) }} =
                <strong>{{ fmt(totalRiskPct) }}%</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="result-box" :class="{ blocked: !finalPass }" aria-live="polite">
          <div v-if="finalPass" class="result-value">{{ shares.toLocaleString('zh-CN') }} 股</div>
          <div v-else class="result-value">不开仓</div>
          <div class="result-label">
            {{
              finalPass
                ? `买入 ${fmt(invest, 0)} 元 · 占本金 ${fmt(posPct)}% · 触发止损约亏 ${fmt(planLoss, 0)} 元（≤ 1R）`
                : '六步走任何一步不通过：缩小或放弃，不破例'
            }}
          </div>
          <div v-if="!finalPass" class="result-reason">{{ finalReason }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
