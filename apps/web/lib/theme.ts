/**
 * ECharts 图表主题常量。
 * 与 styles/tokens.css 保持一致（echarts 无法直接读取 CSS 变量）。
 */
export const chartTheme = {
  textPrimary: '#e8ecf1',
  textSecondary: '#8b95a5',
  textMuted: '#5a6478',
  axisLine: 'rgba(255,255,255,0.14)',
  splitLine: 'rgba(255,255,255,0.06)',
  seriesBlue: '#3b82f6',
  seriesPurple: '#a855f7',
  seriesMuted: '#5a6478',
  accent: '#f97316',
  yellow: '#eab308',
  tooltipBg: '#1a1f2b',
  tooltipBorder: 'rgba(255,255,255,0.12)',
};

/** 通用深色 tooltip 配置 */
export const darkTooltip = {
  backgroundColor: chartTheme.tooltipBg,
  borderColor: chartTheme.tooltipBorder,
  textStyle: { color: chartTheme.textPrimary, fontSize: 12.5 },
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.4); border-radius: 8px;',
} as const;

/** 读取当前主题的 CSS 变量（echarts 无法直接解析 CSS 变量） */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** 每次绘制图表时调用：强调色随分册主题（<html data-volume>）自动变化 */
export function getChartTheme(): typeof chartTheme {
  const accent = cssVar('--accent');
  return accent ? { ...chartTheme, accent } : chartTheme;
}
