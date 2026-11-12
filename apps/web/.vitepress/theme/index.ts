import DefaultTheme from 'vitepress/theme';
import { defineAsyncComponent, type App, type Component } from 'vue';
import { SLOT_IDS, type SlotId } from '../slots';
import SeriesHome from '../../components/SeriesHome.vue';
import VolumeIntro from '../../components/VolumeIntro.vue';
import './custom.css';

/**
 * 契约 §8 槽位注册表：Record<SlotId, Component>，缺项或多余项编译期报错（satisfies）。
 * plugins/content.ts 校验 `::: interactive <SlotId>` 容器后按槽位 id 输出组件标签，
 * 这里把注册表按同一 id 注册为全局组件（markdown 里的组件标签靠全局解析）。
 * defineAsyncComponent 按需分 chunk，未命中槽位的页面不下载 echarts。
 * SeriesHome / VolumeIntro 是站点框架页（index.md、[volume].md）专用，不走槽位注册表。
 */
const slotRegistry = {
  ThreeQuestions: defineAsyncComponent(() => import('../../components/ThreeQuestions.vue')),
  ExpectancyExplorer: defineAsyncComponent(() => import('../../components/ExpectancyExplorer.vue')),
  RecoverCurve: defineAsyncComponent(() => import('../../components/RecoverCurve.vue')),
  PositionCalculator: defineAsyncComponent(() => import('../../components/PositionCalculator.vue')),
  GapConstraint: defineAsyncComponent(() => import('../../components/GapConstraint.vue')),
  DrawdownStreak: defineAsyncComponent(() => import('../../components/DrawdownStreak.vue')),
} satisfies Record<SlotId, Component>;

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: App }) {
    app.component('SeriesHome', SeriesHome);
    app.component('VolumeIntro', VolumeIntro);
    for (const slotId of SLOT_IDS) {
      app.component(slotId, slotRegistry[slotId]);
    }
  },
};
