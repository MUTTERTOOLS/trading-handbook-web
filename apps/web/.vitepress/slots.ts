/**
 * 契约 §5.1 冻结槽位清单（6 个）。词汇表变更须四处同步：
 * docs/content-grammar.md + plugins/content.ts + tools/content/check.ts + 槽位注册表。
 * 只放 id 清单与类型：本模块会被 config.mts → plugins/content.ts 在构建期引入，
 * 组件懒加载器放在 theme/index.ts（含 .vue 动态导入，不能进 config 打包图）。
 */
export const SLOT_IDS = [
  'ThreeQuestions',
  'ExpectancyExplorer',
  'RecoverCurve',
  'PositionCalculator',
  'GapConstraint',
  'DrawdownStreak',
] as const;

export type SlotId = (typeof SLOT_IDS)[number];
