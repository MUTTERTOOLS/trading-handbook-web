<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import echarts from '../lib/echarts';
import type { ChartInstance, ChartOption } from '../lib/echarts';
import { chartTheme, darkTooltip, getChartTheme } from '../lib/theme';

/** 硬上限 H：账户总回撤的强制停手线（起步参考值 12%~15%） */
const HARD_CAP = 15;

/** 单笔风险比例（%），起步参考值 0.5~1，上限 2 */
const riskPct = ref(1);
/** 连亏笔数 */
const streak = ref(7);

/** 连亏 n 笔后的回撤（%）= 1 − (1 − r)^n */
function dd(risk: number, n: number): number {
  return (1 - Math.pow(1 - risk / 100, n)) * 100;
}

const drawdown = computed(() => dd(riskPct.value, streak.value));
const recover = computed(() =>
  drawdown.value >= 100 ? Infinity : (drawdown.value / (100 - drawdown.value)) * 100
);
const overHardCap = computed(() => drawdown.value >= HARD_CAP);

/** 四条曲线：单笔风险 0.5% / 1% / 2% / 5% */
const riskLevels = [0.5, 1, 2, 5];
const nAxis: number[] = [];
for (let n = 1; n <= 15; n++) nAxis.push(n);

const el = ref<HTMLDivElement | null>(null);
let chart: ChartInstance | null = null;
let ro: ResizeObserver | null = null;

function buildOption(): ChartOption {
  const t = getChartTheme();
  const sel = riskPct.value;
  return {
    animationDuration: 300,
    grid: { left: 56, right: 30, top: 44, bottom: 56 },
    legend: {
      top: 4,
      textStyle: { color: chartTheme.textSecondary, fontSize: 12 },
      itemWidth: 18,
      itemHeight: 2,
    },
    tooltip: {
      trigger: 'axis',
      ...darkTooltip,
      formatter: (params: unknown) => {
        const list = params as { seriesName: string; data: [number, number] }[];
        const n = list[0]?.data[0] ?? 0;
        return `连亏 ${n} 笔<br/>` +
          list
            .map((p) => `${p.seriesName}：<strong>${p.data[1].toFixed(1)}%</strong>`)
            .join('<br/>');
      },
    },
    xAxis: {
      type: 'value',
      min: 1,
      max: 15,
      name: '连亏笔数',
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
      max: 60,
      axisLine: { show: false },
      axisLabel: { color: chartTheme.textSecondary, fontSize: 12, formatter: '{value}%' },
      splitLine: { lineStyle: { color: chartTheme.splitLine } },
    },
    series: riskLevels.map((r) => {
      const selected = r === sel;
      return {
        name: `单笔 ${r}%`,
        type: 'line' as const,
        data: nAxis.map((n) => [n, Math.round(dd(r, n) * 10) / 10]),
        symbol: 'none' as const,
        lineStyle: {
          color: selected ? t.accent : chartTheme.seriesBlue,
          width: selected ? 3 : 1.5,
          opacity: selected ? 1 : 0.35,
        },
        emphasis: { disabled: !selected },
        markLine:
          selected
            ? {
                silent: true,
                symbol: 'none',
                label: {
                  formatter: `硬上限 H = ${HARD_CAP}%（起步参考值）`,
                  color: chartTheme.yellow,
                  fontSize: 11,
                  position: 'insideEndTop',
                },
                lineStyle: { color: chartTheme.yellow, type: 'dashed', width: 1.2 },
                data: [{ yAxis: HARD_CAP }],
              }
            : undefined,
        markPoint:
          selected
            ? {
                symbol: 'circle',
                symbolSize: 11,
                data: [{ coord: [streak.value, Math.round(drawdown.value * 10) / 10] }],
                itemStyle: { color: t.accent, borderColor: chartTheme.tooltipBg, borderWidth: 2 },
                label: {
                  show: true,
                  formatter: `${drawdown.value.toFixed(1)}%`,
                  color: t.accent,
                  fontSize: 12,
                  fontWeight: 700,
                  position: 'top',
                  distance: 8,
                },
              }
            : undefined,
        z: selected ? 3 : 2,
      };
    }),
  };
}

onMounted(() => {
  if (!el.value) return;
  chart = echarts.init(el.value);
  chart.setOption(buildOption());
  ro = new ResizeObserver(() => chart?.resize());
  ro.observe(el.value);
});

watch([riskPct, streak], () => chart?.setOption(buildOption()));

onBeforeUnmount(() => {
  ro?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <div class="chart-box">
    <div class="chart-title">同样的连亏，不同的代价（EX-I）· 连亏笔数你控制不了，单笔风险你控制得了</div>
    <div class="calc-grid" style="gap: 20px;">
      <div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="ds-risk">单笔风险比例</label>
            <span class="slider-val tabular">{{ riskPct.toFixed(2) }}%</span>
          </div>
          <input id="ds-risk" v-model.number="riskPct" type="range" min="0.25" max="5" step="0.25" aria-label="单笔风险比例" />
        </div>
        <div class="slider-row">
          <div class="slider-head">
            <label for="ds-streak">连亏笔数</label>
            <span class="slider-val tabular">{{ streak }} 笔</span>
          </div>
          <input id="ds-streak" v-model.number="streak" type="range" min="1" max="15" step="1" aria-label="连亏笔数" />
        </div>
        <div class="stat-grid cols-2" aria-live="polite">
          <div class="stat">
            <div class="stat-label">连亏 {{ streak }} 笔后的回撤</div>
            <div class="stat-value accent">{{ drawdown.toFixed(1) }}%</div>
            <div class="stat-sub">从净值历史高点算起</div>
          </div>
          <div class="stat">
            <div class="stat-label">回本所需涨幅</div>
            <div class="stat-value">{{ recover === Infinity ? '—' : recover.toFixed(1) + '%' }}</div>
            <div class="stat-sub">回本涨幅 = 回撤 ÷ (1 − 回撤)</div>
          </div>
        </div>
        <div style="text-align: center;">
          <span class="verdict" :class="overHardCap ? 'block' : 'neutral'" aria-live="polite">
            {{ overHardCap
              ? '已越过硬上限 H：单笔风险相对账户太大，先降风险，再谈画线'
              : `未越过硬上限 H = ${HARD_CAP}%（起步参考值，需个人校准）` }}
          </span>
        </div>
      </div>
      <div class="chart-container" ref="el" role="img" aria-label="连亏笔数与回撤的关系：单笔风险越高，同样连亏造成的回撤越深；黄色虚线为硬上限15%"></div>
    </div>
  </div>
</template>
