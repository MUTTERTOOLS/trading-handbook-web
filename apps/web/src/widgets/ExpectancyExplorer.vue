<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import echarts from '@/shared/lib/echarts';
import type { ChartInstance, ChartOption } from '@/shared/lib/echarts';
import { chartTheme, darkTooltip, getChartTheme } from '@/shared/lib/theme';

/** 胜率（%） */
const winRate = ref(40);
/** 平均盈利（%/笔） */
const avgWin = ref(6);
/** 平均亏损（%/笔） */
const avgLoss = ref(2);
/** 单笔往返成本（%，回测口径示意） */
const cost = ref(0.2);

interface Preset {
  name: string;
  desc: string;
  w: number; win: number; loss: number; c: number;
}
const presets: Preset[] = [
  { name: 'EX-E', desc: '高胜率亏钱', w: 80, win: 2, loss: 10, c: 0.2 },
  { name: 'EX-F', desc: '低胜率赚钱', w: 40, win: 6, loss: 2, c: 0.2 },
  { name: 'EX-G', desc: '超短式配平', w: 65, win: 4, loss: 8, c: 0.2 },
];
function applyPreset(t: Preset) {
  winRate.value = t.w;
  avgWin.value = t.win;
  avgLoss.value = t.loss;
  cost.value = t.c;
}

const payoff = computed(() => (avgLoss.value > 0 ? avgWin.value / avgLoss.value : 0));
/** 盈亏平衡胜率（不计成本）= 1 / (1 + 盈亏比) */
const breachNoCost = computed(() => (100 / (1 + payoff.value)));
/** 含成本及格线 = (平均亏损 + 成本) / (平均盈利 + 平均亏损) */
const breachWithCost = computed(
  () => ((avgLoss.value + cost.value) / (avgWin.value + avgLoss.value)) * 100
);
/** 单笔期望（不计成本，%/笔） */
const eGross = computed(
  () => (winRate.value * avgWin.value - (100 - winRate.value) * avgLoss.value) / 100
);
/** 单笔期望（计成本，%/笔） */
const eNet = computed(() => eGross.value - cost.value);
/** 余量 = 实际胜率 − 含成本及格线（百分点） */
const margin = computed(() => winRate.value - breachWithCost.value);
const onLine = computed(() => margin.value > 0);

const el = ref<HTMLDivElement | null>(null);
let chart: ChartInstance | null = null;
let ro: ResizeObserver | null = null;

/** 盈亏平衡曲线数据：盈亏比 0.2~5 */
const rAxis: number[] = [];
for (let r = 0.2; r <= 5.001; r += 0.1) rAxis.push(Math.round(r * 100) / 100);

function buildOption(): ChartOption {
  const t = getChartTheme();
  const loss = avgLoss.value;
  const c = cost.value;
  const base = rAxis.map((r) => [r, 100 / (1 + r)]);
  const withCost =
    c > 0 ? rAxis.map((r) => [r, ((loss + c) / (loss * (1 + r))) * 100]) : [];
  return {
    animationDuration: 300,
    grid: { left: 56, right: 96, top: 40, bottom: 56 },
    tooltip: {
      trigger: 'axis',
      ...darkTooltip,
      formatter: (params: unknown) => {
        const list = params as { seriesName: string; data: [number, number] }[];
        const r = list[0]?.data[0] ?? 0;
        return `盈亏比 ${r.toFixed(1)}<br/>` +
          list
            .map((p) => `${p.seriesName}：<strong>${p.data[1].toFixed(1)}%</strong>`)
            .join('<br/>');
      },
    },
    xAxis: {
      type: 'value',
      min: 0.2,
      max: 5,
      name: '盈亏比（平均盈利 ÷ 平均亏损）',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: chartTheme.textMuted, fontSize: 12 },
      axisLine: { lineStyle: { color: chartTheme.axisLine } },
      axisLabel: { color: chartTheme.textSecondary, fontSize: 12 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '及格线（%）',
      nameTextStyle: { color: chartTheme.textMuted, fontSize: 12, align: 'left' },
      axisLine: { show: false },
      axisLabel: { color: chartTheme.textSecondary, fontSize: 12, formatter: '{value}%' },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [
      {
        name: '不计成本及格线',
        type: 'line',
        data: base,
        symbol: 'none',
        lineStyle: { color: chartTheme.seriesBlue, width: 2.5 },
        markPoint: {
          symbol: 'circle',
          symbolSize: 11,
          data: [{ coord: [payoff.value, Math.min(100, winRate.value)] }],
          itemStyle: { color: t.accent, borderColor: chartTheme.tooltipBg, borderWidth: 2 },
          label: {
            show: true,
            formatter: `当前：胜率 ${winRate.value}%`,
            color: t.accent,
            fontSize: 12,
            fontWeight: 700,
            position: 'right',
            distance: 8,
          },
        },
        z: 3,
      },
      {
        name: '含成本及格线',
        type: 'line',
        data: withCost,
        symbol: 'none',
        lineStyle: { color: chartTheme.yellow, width: 1.5, type: 'dashed' },
        endLabel: {
          show: c > 0,
          formatter: '成本把线抬高',
          color: chartTheme.yellow,
          fontSize: 11,
        },
        z: 2,
      },
    ],
  };
}

onMounted(() => {
  if (!el.value) return;
  chart = echarts.init(el.value);
  chart.setOption(buildOption());
  ro = new ResizeObserver(() => chart?.resize());
  ro.observe(el.value);
});

watch([winRate, avgWin, avgLoss, cost], () => chart?.setOption(buildOption()));

onBeforeUnmount(() => {
  ro?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <div class="calc-widget">
    <div class="widget-title">期望值探索器 · 胜率过线才算数</div>
    <p class="widget-desc">
      拖动滑块，看单笔期望与及格线怎么变。点"在线上方"只是必要条件——方法是否真有效，还须送册六的验证流程〔B6-C12〕。
    </p>

    <div class="calc-grid">
      <div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="ee-win">胜率</label>
            <span class="slider-val tabular">{{ winRate }}%</span>
          </div>
          <input id="ee-win" v-model.number="winRate" type="range" min="5" max="95" step="1" aria-label="胜率" />
        </div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="ee-avgwin">平均盈利（%/笔）</label>
            <span class="slider-val tabular">{{ avgWin }}%</span>
          </div>
          <input id="ee-avgwin" v-model.number="avgWin" type="range" min="0.5" max="20" step="0.1" aria-label="平均盈利" />
        </div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="ee-avgloss">平均亏损（%/笔）</label>
            <span class="slider-val tabular">{{ avgLoss }}%</span>
          </div>
          <input id="ee-avgloss" v-model.number="avgLoss" type="range" min="0.5" max="20" step="0.1" aria-label="平均亏损" />
        </div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="ee-cost">单笔往返成本（%）<span style="font-weight: 400;">· 示意口径，费率以〔B2-C05〕核验为准</span></label>
            <span class="slider-val tabular">{{ cost.toFixed(2) }}%</span>
          </div>
          <input id="ee-cost" v-model.number="cost" type="range" min="0" max="0.5" step="0.01" aria-label="单笔往返成本" />
        </div>

        <div class="preset-row" role="group" aria-label="载入统一算例">
          <button
            v-for="t in presets"
            :key="t.name"
            type="button"
            class="preset-btn"
            :aria-label="`载入 ${t.name} ${t.desc}`"
            @click="applyPreset(t)"
          >
            <strong>{{ t.name }}</strong>
            {{ t.desc }}
          </button>
        </div>
      </div>

      <div>
        <div class="stat-grid cols-2" aria-live="polite">
          <div class="stat">
            <div class="stat-label">单笔期望 E（计成本）</div>
            <div class="stat-value">{{ eNet >= 0 ? '+' : '' }}{{ eNet.toFixed(2) }}%/笔</div>
            <div class="stat-sub">不计成本为 {{ eGross >= 0 ? '+' : '' }}{{ eGross.toFixed(2) }}%/笔</div>
          </div>
          <div class="stat">
            <div class="stat-label">盈亏比</div>
            <div class="stat-value">{{ payoff.toFixed(2) }}</div>
            <div class="stat-sub">平均盈利 ÷ 平均亏损</div>
          </div>
          <div class="stat">
            <div class="stat-label">及格线（不计成本）</div>
            <div class="stat-value">{{ breachNoCost.toFixed(1) }}%</div>
            <div class="stat-sub">p = 1 ÷ (1 + 盈亏比)</div>
          </div>
          <div class="stat">
            <div class="stat-label">及格线（计成本）</div>
            <div class="stat-value">{{ breachWithCost.toFixed(1) }}%</div>
            <div class="stat-sub">(亏损 + 成本) ÷ (盈利 + 亏损)</div>
          </div>
        </div>

        <div style="text-align: center; margin: 14px 0 4px;">
          <span class="verdict" :class="onLine ? 'pass' : 'block'" aria-live="polite">
            {{ onLine
              ? `计入成本后在线上方 · 余量 ${margin.toFixed(1)} 个百分点`
              : `在线下方 · 差 ${Math.abs(margin).toFixed(1)} 个百分点` }}
          </span>
        </div>
        <p class="table-note" style="text-align: center; margin-top: 8px;">
          余量要和胜率统计自身的误差比：30 笔样本下 50% 胜率的 95% 区间约 ±18 个百分点（EX-L）。
        </p>
        <div class="chart-container" ref="el" role="img" aria-label="盈亏平衡曲线：及格线随盈亏比滑动，虚线为计入成本后的及格线，橙点为当前位置"></div>
      </div>
    </div>
  </div>
</template>
