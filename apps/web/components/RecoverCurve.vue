<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import echarts from '../lib/echarts';
import type { ChartInstance, ChartOption } from '../lib/echarts';
import { chartTheme, darkTooltip, getChartTheme } from '../lib/theme';

/** 示例账户本金（EX-A：100,000 元，主人公小明） */
const PRINCIPAL = 100000;

/** 亏损比例（%），0~90 */
const lossPct = ref(30);

/** 账户剩余（元） */
const remaining = computed(() => Math.round(PRINCIPAL * (1 - lossPct.value / 100)));

/** 回本所需涨幅（%）= d / (1 - d) */
const recoverPct = computed(() =>
  lossPct.value <= 0 ? 0 : (lossPct.value / (100 - lossPct.value)) * 100
);

/** 比直觉（亏多少涨多少）多出多少个百分点 */
const extraPp = computed(() => Math.max(0, recoverPct.value - lossPct.value));

/** EX-H 曲线：亏损 0~90，每 1% 一点 */
const curveData: [number, number][] = [];
for (let d = 0; d <= 90; d++) {
  curveData.push([d, d <= 0 ? 0 : (d / (100 - d)) * 100]);
}
/** 参考线：y = x，"亏多少就涨多少"的直觉预期 */
const refLine: [number, number][] = [
  [0, 0],
  [90, 90],
];

const el = ref<HTMLDivElement | null>(null);
let chart: ChartInstance | null = null;
let ro: ResizeObserver | null = null;

function buildOption(): ChartOption {
  const t = getChartTheme();
  const p = lossPct.value;
  const r = recoverPct.value;
  // 纵轴动态上限：整体可读，同时保证当前点可见
  const yMax = Math.max(120, Math.ceil((r * 1.3) / 50) * 50);
  return {
    animationDuration: 300,
    grid: { left: 64, right: 130, top: 40, bottom: 56 },
    tooltip: {
      trigger: 'axis',
      ...darkTooltip,
      formatter: (params: unknown) => {
        const list = params as { axisValue: number; seriesName: string; data: [number, number] }[];
        const d = list[0]?.axisValue ?? 0;
        const rec = (d <= 0 ? 0 : (d / (100 - d)) * 100).toFixed(1);
        return `亏损 ${d}%<br/>回本需涨 <strong>${rec}%</strong>`;
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 90,
      name: '亏损比例（%）',
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
      max: yMax,
      name: '回本所需涨幅（%）',
      nameTextStyle: { color: chartTheme.textMuted, fontSize: 12, align: 'left' },
      axisLine: { show: false },
      axisLabel: { color: chartTheme.textSecondary, fontSize: 12 },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: [
      {
        name: '回本所需涨幅',
        type: 'line',
        data: curveData,
        smooth: false,
        symbol: 'none',
        lineStyle: { color: chartTheme.seriesBlue, width: 2.5 },
        markPoint: {
          symbol: 'circle',
          symbolSize: 11,
          data: [{ coord: [p, r] }],
          itemStyle: { color: t.accent, borderColor: chartTheme.tooltipBg, borderWidth: 2 },
          label: {
            show: true,
            formatter: `亏${p}% → 涨${r.toFixed(1)}%`,
            color: t.accent,
            fontSize: 12,
            fontWeight: 700,
            position: 'top',
            distance: 10,
          },
        },
        z: 3,
      },
      {
        name: '直觉：亏多少涨多少',
        type: 'line',
        data: refLine,
        symbol: 'none',
        lineStyle: { color: chartTheme.textMuted, width: 1.5, type: 'dashed' },
        endLabel: {
          show: true,
          formatter: '亏多少涨多少（直觉）',
          color: chartTheme.textMuted,
          fontSize: 11,
        },
        z: 2,
      },
    ],
  };
}

function redraw() {
  chart?.setOption(buildOption());
}

onMounted(() => {
  if (!el.value) return;
  chart = echarts.init(el.value);
  chart.setOption(buildOption());
  ro = new ResizeObserver(() => chart?.resize());
  ro.observe(el.value);
});

watch(lossPct, redraw);

onBeforeUnmount(() => {
  ro?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <div class="chart-box">
    <div class="chart-title">亏损越深，回本越难（EX-H）· 拖动滑块试试</div>
    <div class="slider-row" style="max-width: 480px; margin: 0 auto 8px;">
      <div class="slider-head">
        <label for="rc-loss">亏损比例</label>
        <span class="slider-val tabular">{{ lossPct }}%</span>
      </div>
      <input
        id="rc-loss"
        v-model.number="lossPct"
        type="range"
        min="0"
        max="90"
        step="1"
        aria-label="亏损比例"
      />
    </div>
    <div class="stat-grid cols-3" aria-live="polite">
      <div class="stat">
        <div class="stat-label">账户剩余（本金 100,000 元）</div>
        <div class="stat-value">{{ remaining.toLocaleString('zh-CN') }} 元</div>
      </div>
      <div class="stat">
        <div class="stat-label">回本所需涨幅</div>
        <div class="stat-value accent">{{ recoverPct.toFixed(1) }}%</div>
      </div>
      <div class="stat">
        <div class="stat-label">比"亏多少涨多少"的直觉多</div>
        <div class="stat-value">+{{ extraPp.toFixed(1) }} 个百分点</div>
      </div>
    </div>
    <div class="chart-container" ref="el" role="img" aria-label="亏损比例与回本所需涨幅关系曲线，实线为回本涨幅，虚线为亏多少涨多少的直觉参考线"></div>
    <p class="table-note" style="text-align: center;">
      实线始终在虚线上方，且越往右张口越大——回本难度加速上升，不是等比例增加。
    </p>
  </div>
</template>
