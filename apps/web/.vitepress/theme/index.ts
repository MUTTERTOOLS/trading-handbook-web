import DefaultTheme from 'vitepress/theme';
import { defineAsyncComponent, type App, type Component } from 'vue';
import SeriesHome from '../../components/SeriesHome.vue';
import VolumeIntro from '../../components/VolumeIntro.vue';
import './custom.css';

/**
 * 交互组件全局注册：正文里直接写 `<PositionCalculator />` 即可。
 * 用 defineAsyncComponent 按需分 chunk，避免 echarts 进公共包。
 */
const widgets: Record<string, () => Promise<Component>> = {
  ThreeQuestions: () => import('../../components/ThreeQuestions.vue'),
  ExpectancyExplorer: () => import('../../components/ExpectancyExplorer.vue'),
  RecoverCurve: () => import('../../components/RecoverCurve.vue'),
  PositionCalculator: () => import('../../components/PositionCalculator.vue'),
  GapConstraint: () => import('../../components/GapConstraint.vue'),
  DrawdownStreak: () => import('../../components/DrawdownStreak.vue'),
};

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: App }) {
    app.component('SeriesHome', SeriesHome);
    app.component('VolumeIntro', VolumeIntro);
    for (const [name, loader] of Object.entries(widgets)) {
      app.component(name, defineAsyncComponent(loader));
    }
  },
};
