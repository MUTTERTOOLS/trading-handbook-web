import { defineAsyncComponent, type Component } from 'vue';

/**
 * 交互组件注册表：id 与 content/edition.yaml 中的 id 对应。
 * 用异步组件按需加载，避免没有组件的分册也下载 echarts。
 */
export const widgetMap: Record<string, Component> = {
  ThreeQuestions: defineAsyncComponent(() => import('./ThreeQuestions.vue')),
  ExpectancyExplorer: defineAsyncComponent(() => import('./ExpectancyExplorer.vue')),
  RecoverCurve: defineAsyncComponent(() => import('./RecoverCurve.vue')),
  PositionCalculator: defineAsyncComponent(() => import('./PositionCalculator.vue')),
  GapConstraint: defineAsyncComponent(() => import('./GapConstraint.vue')),
  DrawdownStreak: defineAsyncComponent(() => import('./DrawdownStreak.vue')),
};
