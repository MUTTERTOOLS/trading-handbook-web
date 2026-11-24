import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import {
  parseAll,
  chapterSource,
  extractFrontmatter,
  type ParsedSeries,
} from './parse.js';
import type { Chapter } from '@trading-handbook/content-model';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');

const REQUIRED_SECTIONS: Array<{ label: string; test: (source: string) => boolean }> = [
  { label: '开场问题', test: (s) => /^##\s+开场问题\s*$/m.test(s) },
  { label: '一句话结论', test: (s) => /^##\s+一句话结论\s*$/m.test(s) },
  { label: '本章学习目标', test: (s) => /^##\s+本章学习目标\s*$/m.test(s) },
  { label: '正文', test: (s) => /^##\s+正文\s*$/m.test(s) },
  { label: '常见误区', test: (s) => /^##\s+常见误区\s*$/m.test(s) },
  { label: '本章小结', test: (s) => /^##\s+本章小结\s*$/m.test(s) },
  { label: '自测题', test: (s) => /^##\s+自测题\s*$/m.test(s) },
  { label: '速查卡', test: (s) => /^##\s+速查卡/m.test(s) },
  { label: '延伸与链接', test: (s) => /^##\s+延伸与链接\s*$/m.test(s) },
  { label: '风险提示', test: (s) => /^##\s+.*风险提示\s*$/m.test(s) },
];

const FORBIDDEN_WORDS = [
  '稳赚',
  '必涨',
  '圣杯',
  '保本',
  '无风险',
  '跟我买',
  '六元',
  '门派一',
  '门派二',
  '门派三',
  '门派四',
  '悟道',
  '出神入化',
  '一眼看穿',
];

/**
 * 这些词出现在驳斥、举例、防骗语境里是允许的；只有脱离语境的正向使用才报错。
 * 引号内的内容一律视为引用，不算违规。
 */
const CRITICAL_MARKERS = [
  '虚构',
  '话术',
  '驳斥',
  '误区',
  '骗局',
  '红旗',
  '所谓',
  '号称',
  '警惕',
  '识别',
  '拆解',
  '反例',
  '示例',
  '广告',
  '承诺',
  '禁止',
  '避免',
  '不能',
  '不是',
  '别',
  '拒绝',
  '戳穿',
  '看穿',
  '违法',
  '撒谎',
  '红线',
  '禁用',
  '不用',
  '未使用',
  '不保证',
  '不构成',
  '无收益',
  '收益承诺',
  '风险提示',
  '反诈',
  '防骗',
  '标题',
  '引用',
  '练习',
  '判断',
  '改错',
  '扣分',
  '戏称',
  '俗称',
];

interface Issue {
  level: 'error' | 'warning';
  chapterId: string;
  message: string;
}

/**
 * 容器词汇（契约 §5）：类型白名单 + 槽位冻结清单。
 * 与 apps/web/.vitepress/plugins/content.ts、slots.ts 同步，词汇表变更需同时更新；
 * qa-cards / layer-map / flow-steps（契约 §5.3~§5.5）渲染由 plugins/content.ts
 * 直出，不占槽位注册表。
 */
const CONTAINER_TYPES = ['interactive', 'figure-spec', 'qa-cards', 'layer-map', 'flow-steps'] as const;
const SLOT_IDS = [
  'ThreeQuestions',
  'ExpectancyExplorer',
  'RecoverCurve',
  'PositionCalculator',
  'GapConstraint',
  'DrawdownStreak',
] as const;

/** 可识别 HTML 标签形态；`<` 比较符 / 箭头等不会命中 */
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/;

interface ContainerIssue {
  level: 'error';
  message: string;
}

interface ContainerRow {
  text: string;
  /** 该行在章文件中的行号（1 起） */
  no: number;
}

/**
 * layer-map 容器体校验（契约 §5.4）：层行 ≥2、字段行的层名须已由（先行的）
 * 层行声明、底座行 ≤1、未知行式报错。行式分类口径与
 * apps/web/.vitepress/plugins/content.ts 的 parseLayerMap 同源（层名重复
 * 由渲染侧兜底报错，此处不重复计数）。
 */
function checkLayerMapBody(rows: ContainerRow[], openLine: number, issues: ContainerIssue[]): void {
  const declared = new Set<string>();
  let layers = 0;
  let bases = 0;
  for (const { text, no } of rows) {
    if (text.startsWith('底座：')) {
      bases++;
      if (bases > 1) {
        issues.push({ level: 'error', message: `layer-map 底座行至多一条（第 ${no} 行）` });
      }
      continue;
    }
    const layerMatch = text.match(/^层\s+(.+?)(?:（(.+?)）)?：/);
    if (layerMatch) {
      declared.add(layerMatch[1]!.trim());
      layers++;
      continue;
    }
    const fieldMatch = text.match(/^(.+?)·(.+?)：/);
    if (fieldMatch) {
      if (!declared.has(fieldMatch[1]!.trim())) {
        issues.push({
          level: 'error',
          message: `layer-map 字段行的层名"${fieldMatch[1]!.trim()}"未由层行声明（第 ${no} 行）`,
        });
      }
      continue;
    }
    issues.push({
      level: 'error',
      message: `layer-map 未知行式（第 ${no} 行）：仅允许 层行／字段行／底座行，"${text.slice(0, 24)}"`,
    });
  }
  if (layers < 2) {
    issues.push({
      level: 'error',
      message: `layer-map 层行至少 2 条，实际 ${layers} 条（第 ${openLine} 行起的容器）`,
    });
  }
}

/**
 * 步行冒号后段序列校验（契约 §5.5）：`输入 …` → `→ 输出 …` → `｜不通过 …`
 * 依次可选、至少一段、段内容非空；无法归段的残文即未知段式。
 * 返回 null = 合法，否则返回错误消息。口径与
 * apps/web/.vitepress/plugins/content.ts 的 parseStepSegments 同源。
 */
function checkStepSegments(raw: string): string | null {
  let rest = raw;
  const hasSegment = { input: false, output: false, fail: false };
  if (rest.startsWith('输入')) {
    rest = rest.slice('输入'.length);
    const boundary = rest.search(/→|｜/);
    hasSegment.input = (boundary < 0 ? rest : rest.slice(0, boundary)).trim().length > 0;
    if (!hasSegment.input) return '步行"输入"段内容为空';
    rest = boundary < 0 ? '' : rest.slice(boundary);
  }
  if (rest.startsWith('→')) {
    const head = rest.match(/^→\s*输出/);
    if (!head) return '步行未知段式，"→"后应为"输出"';
    rest = rest.slice(head[0].length);
    const boundary = rest.search(/｜/);
    hasSegment.output = (boundary < 0 ? rest : rest.slice(0, boundary)).trim().length > 0;
    if (!hasSegment.output) return '步行"输出"段内容为空';
    rest = boundary < 0 ? '' : rest.slice(boundary);
  }
  if (rest.startsWith('｜')) {
    const head = rest.match(/^｜\s*不通过/);
    if (!head) return '步行未知段式，"｜"后应为"不通过"';
    rest = rest.slice(head[0].length);
    hasSegment.fail = rest.trim().length > 0;
    if (!hasSegment.fail) return '步行"不通过"段内容为空';
    rest = '';
  }
  if (rest.trim()) return `步行未知段式（仅允许 输入／→ 输出／｜不通过，按此顺序）："${rest.trim().slice(0, 24)}"`;
  if (!hasSegment.input && !hasSegment.output && !hasSegment.fail) {
    return '步行冒号后至少一段（输入／→ 输出／｜不通过）';
  }
  return null;
}

/**
 * flow-steps 容器体校验（契约 §5.5）：步行 ≥2、含 ｜不通过 段时出口行必填
 * 且恰 1 条、出口行／分界行各 ≤1、未知行式报错。分界行子句（`③④之间 …`、
 * `⑤旁 …`）的定位与渲染归 plugins/content.ts，此处只执法行式与条数。
 */
function checkFlowStepsBody(rows: ContainerRow[], openLine: number, issues: ContainerIssue[]): void {
  let steps = 0;
  let exits = 0;
  let dividers = 0;
  let hasFail = false;
  for (const { text, no } of rows) {
    if (text.startsWith('出口：')) {
      exits++;
      if (exits > 1) {
        issues.push({ level: 'error', message: `flow-steps 出口行至多一条（第 ${no} 行）` });
      }
      continue;
    }
    if (text.startsWith('分界：')) {
      dividers++;
      if (dividers > 1) {
        issues.push({ level: 'error', message: `flow-steps 分界行至多一条（第 ${no} 行）` });
      }
      continue;
    }
    const demoMatch = text.match(/^演示\s+(.+)$/);
    if (demoMatch) {
      const colon = demoMatch[1]!.indexOf('：');
      if (colon < 0) {
        issues.push({
          level: 'error',
          message: `flow-steps 演示行缺"路径名：代价"形态（第 ${no} 行）`,
        });
      }
      continue;
    }
    const stepMatch = text.match(/^步\s+(.+)$/);
    if (stepMatch) {
      steps++;
      const colon = stepMatch[1]!.indexOf('：');
      if (colon < 0) {
        issues.push({
          level: 'error',
          message: `flow-steps 步行缺冒号段（第 ${no} 行）`,
        });
        continue;
      }
      const segmentError = checkStepSegments(stepMatch[1]!.slice(colon + 1));
      if (segmentError) {
        issues.push({ level: 'error', message: `flow-steps ${segmentError}（第 ${no} 行）` });
      }
      if (/｜\s*不通过/.test(stepMatch[1]!.slice(colon + 1))) hasFail = true;
      continue;
    }
    issues.push({
      level: 'error',
      message: `flow-steps 未知行式（第 ${no} 行）：仅允许 步行／出口行／分界行／演示行，"${text.slice(0, 24)}"`,
    });
  }
  if (steps < 2) {
    issues.push({
      level: 'error',
      message: `flow-steps 步行至少 2 条，实际 ${steps} 条（第 ${openLine} 行起的容器）`,
    });
  }
  if (hasFail && exits !== 1) {
    issues.push({
      level: 'error',
      message: `flow-steps 含"｜不通过"段时出口行必填且恰 1 条，实际 ${exits} 条（第 ${openLine} 行起的容器）`,
    });
  }
}

/**
 * 容器词汇校验（契约 §7.9）：
 * - `:::` 打开行的类型必须在白名单内；未知类型 / 缺类型报错
 * - interactive 槽位 id 必须在冻结清单内，且容器体为空，同章同槽位至多一次
 * - figure-spec 不带参数
 * - qa-cards / layer-map / flow-steps 容器体按契约 §5.3~§5.5 体例校验
 *   （行式分类与 plugins/content.ts 渲染解析同口径，报错带行号）
 * - 容器不嵌套、必须闭合（代码围栏内的 ::: 不参与解析）
 */
/** 导出仅供自证渲染断言脚本（临时）直接调用；门禁入口仍是 main() 全树扫描 */
export function checkContainers(body: string): ContainerIssue[] {
  const issues: ContainerIssue[] = [];
  const usedSlots = new Map<string, number>();
  const openStack: Array<{ line: number; type: string }> = [];
  let inCodeFence = false;

  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    if (!/^:::+/.test(line)) continue;
    const params = line.replace(/^:::+/, '').trim();

    if (params && openStack.length > 0) {
      issues.push({
        level: 'error',
        message: `容器嵌套（第 ${i + 1} 行）："::: ${params}" 未先闭合 "${openStack[openStack.length - 1]!.type}"`,
      });
      break;
    }
    if (params) {
      const [type, ...args] = params.split(/\s+/);
      if (!CONTAINER_TYPES.includes(type as (typeof CONTAINER_TYPES)[number])) {
        issues.push({
          level: 'error',
          message: `未知容器类型（第 ${i + 1} 行）："${type}"，仅允许 ${CONTAINER_TYPES.join(' / ')}`,
        });
        break;
      }
      if (type === 'interactive') {
        const slotId = args[0];
        if (args.length !== 1 || !(SLOT_IDS as readonly string[]).includes(slotId!)) {
          issues.push({
            level: 'error',
            message: `interactive 槽位 id 非法（第 ${i + 1} 行）："${params}"，冻结清单：${SLOT_IDS.join(' / ')}`,
          });
          break;
        }
        usedSlots.set(slotId!, (usedSlots.get(slotId!) ?? 0) + 1);
        if (usedSlots.get(slotId!)! > 1) {
          issues.push({
            level: 'error',
            message: `同一章同一槽位重复：interactive ${slotId}`,
          });
        }
      } else if (type === 'figure-spec' && args.length) {
        issues.push({
          level: 'error',
          message: `figure-spec 不接受参数（第 ${i + 1} 行）："${params}"`,
        });
        break;
      }
      openStack.push({ line: i + 1, type: type! });
      continue;
    }

    // `:::` 闭合行
    if (openStack.length > 0) {
      const open = openStack.pop()!;
      if (open.type === 'interactive') {
        // 容器体必须为空：打开行到闭合行之间不能有非空白内容
        const bodyEnd = lines
          .slice(open.line, i)
          .join('\n')
          .trim();
        if (bodyEnd) {
          issues.push({
            level: 'error',
            message: `interactive 容器体内必须为空（契约 §5.1）：${open.line + 1} 行起`,
          });
        }
      }
      if (open.type === 'qa-cards') {
        // qa-cards 容器体（契约 §5.3）：至少一条对答行、结论行至多一条；
        // 结论行识别与渲染插件同口径（`结论：` 全角冒号严格形态）。
        const rows = lines
          .slice(open.line, i)
          .map((row) => row.trim())
          .filter(Boolean);
        const answers = rows.filter((row) => !row.startsWith('结论：'));
        const verdicts = rows.filter((row) => row.startsWith('结论：'));
        if (answers.length === 0) {
          issues.push({
            level: 'error',
            message: `qa-cards 容器体至少需要一条对答行（第 ${open.line} 行起的容器）`,
          });
        }
        if (verdicts.length > 1) {
          issues.push({
            level: 'error',
            message: `qa-cards 结论行至多一条，发现 ${verdicts.length} 条（第 ${open.line} 行起的容器）`,
          });
        }
      }
      if (open.type === 'layer-map' || open.type === 'flow-steps') {
        // 容器体行 + 行号（契约 §5.4/§5.5 体例校验，与渲染插件解析同口径）
        const rows: ContainerRow[] = [];
        for (let j = open.line; j < i; j++) {
          const text = lines[j]!.trim();
          if (text) rows.push({ text, no: j + 1 });
        }
        if (open.type === 'layer-map') {
          checkLayerMapBody(rows, open.line, issues);
        } else {
          checkFlowStepsBody(rows, open.line, issues);
        }
      }
    } else {
      issues.push({
        level: 'error',
        message: `容器闭合 :::（第 ${i + 1} 行）缺少打开行`,
      });
    }
  }

  if (openStack.length > 0) {
    issues.push({
      level: 'error',
      message: `容器 "${openStack[0]!.type}" 未闭合（第 ${openStack[0]!.line} 行）`,
    });
  }
  return issues;
}

/**
 * 读者可见字符数（契约 §6.3，2026-11-20 双层口径）：按层分别累计，返回
 * 主体层 / 选读层两个计数——
 * - 主体层（main）：延伸与链接节以外的全部读者可见字符；
 * - 选读层（extra）：围栏外 `## 延伸与链接` 标题行起，至下一个围栏外 `## `
 *   标题行（即 ⚠️ 风险提示）之前的可见字符，含该标题行本身。
 * 剔除规则在两层内照常生效：
 * 1) frontmatter 块（含 `---` 围栏行）；
 * 2) `::: figure-spec` 容器整体（开栏行 + 容器体 + 闭栏行，制图说明不进渲染输出）；
 * 3) `::: interactive <SlotId>` 容器（开栏行 + 闭栏行，容器体必须为空）。
 * `::: qa-cards`／`::: layer-map`／`::: flow-steps` 容器体是读者可见内容
 * （契约 §5.3~§5.5），计入其所在层——参数行（卡头题句／图题）计入，
 * `:::` 围栏行与类型词不计（契约 §6.3）。
 * 边界解析与 checkContainers 同口径：``` / ~~~ 行切换代码围栏状态，围栏外的
 * `:::` 与 `## ` 才参与容器开闭 / 层切换——延伸节体内嵌代码围栏或容器
 * （含围栏中的 `##` 字样行）不会误触层边界。
 */
function countVisibleChars(source: string): { main: number; extra: number } {
  // frontmatter 剔除与 parse.ts extractFrontmatter 同一正则（含围栏行）
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  let inCodeFence = false;
  let inContainer: string | null = null;
  let inExtra = false;
  let main = 0;
  let extra = 0;

  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inContainer !== null) {
      // 容器体：一律不可见；仅围栏外的闭栏 `:::` 结束剔除
      if (!inCodeFence && /^:::+\s*$/.test(line)) inContainer = null;
      continue;
    }
    if (/^:::+/.test(line)) {
      const params = line.replace(/^:::+/, '').trim();
      if (params) {
        const type = params.split(/\s+/)[0]!;
        if (type === 'figure-spec' || type === 'interactive') inContainer = type;
        // 参数行（卡头题句／图题）计入（契约 §6.3）：类型词随 `:::` 围栏不计
        if (type === 'qa-cards' || type === 'layer-map' || type === 'flow-steps') {
          const paramText = params.slice(type.length).trim();
          const count = paramText.replace(/\s/g, '').length;
          if (inExtra) extra += count;
          else main += count;
        }
      }
      // 开栏行与游离闭栏行本身非读者可见文本，不计入（未知容器类型由 checkContainers 报错）
      continue;
    }
    // 选读层边界：围栏外 `## 延伸与链接` 进入；下一个围栏外 `## ` 标题行退出
    if (!inCodeFence && /^##\s/.test(line)) {
      inExtra = /^##\s+延伸与链接\s*$/.test(line);
    }
    const count = line.replace(/\s/g, '').length;
    if (inExtra) extra += count;
    else main += count;
  }
  return { main, extra };
}

function lastIndex(source: string, needle: string, end: number): number {
  return source.lastIndexOf(needle, end);
}

function insideQuotes(source: string, index: number): boolean {
  const before = source.slice(0, index);
  const doubleQuotes = (before.match(/"/g) ?? []).length;
  if (doubleQuotes % 2 === 1) return true;
  if (lastIndex(before, '“', before.length) > lastIndex(before, '”', before.length)) return true;
  if (lastIndex(before, '「', before.length) > lastIndex(before, '」', before.length)) return true;
  if (lastIndex(before, '『', before.length) > lastIndex(before, '』', before.length)) return true;
  return false;
}

function allowedForbiddenContext(source: string, index: number, word: string): boolean {
  if (insideQuotes(source, index)) return true;
  const before = source.slice(Math.max(0, index - 70), index);
  const after = source.slice(index + word.length, index + word.length + 70);
  const context = before + word + after;
  if (CRITICAL_MARKERS.some((marker) => context.includes(marker))) return true;
  // 《三步稳赚法》这类书名/标题里的引用
  if (/《[^》]*$/.test(before) && /^[^《]*》/.test(after)) return true;
  return false;
}

function checkForbidden(source: string, chapterId: string): Issue[] {
  const issues: Issue[] = [];
  for (const word of FORBIDDEN_WORDS) {
    let index = -1;
    while ((index = source.indexOf(word, index + 1)) >= 0) {
      if (allowedForbiddenContext(source, index, word)) continue;
      const context = source
        .slice(Math.max(0, index - 40), index + word.length + 40)
        .replace(/\s+/g, ' ');
      issues.push({
        level: 'error',
        chapterId,
        message: `禁用词「${word}」缺少驳斥/引用语境：…${context}…`,
      });
    }
  }
  return issues;
}

function checkChapter(chapter: Chapter, source: string): Issue[] {
  const issues: Issue[] = [];
  const { body } = extractFrontmatter(source);

  for (const section of REQUIRED_SECTIONS) {
    if (!section.test(source)) {
      issues.push({
        level: 'error',
        chapterId: chapter.id,
        message: `缺少小节：## ${section.label}`,
      });
    }
  }

  const chars = countVisibleChars(source);
  if (chars.main < 2400) {
    issues.push({
      level: 'error',
      chapterId: chapter.id,
      message: `主体正文字数过少（主体口径）：${chars.main}（下限 2400）`,
    });
  } else if (chars.main > 8000) {
    issues.push({
      level: 'warning',
      chapterId: chapter.id,
      message: `主体正文字数（主体口径）${chars.main} 超过 8000；如经总编批准请保留，否则考虑拆分`,
    });
  }
  if (chars.extra > 1200) {
    issues.push({
      level: 'warning',
      chapterId: chapter.id,
      message: `选读层（延伸与链接节）字数 ${chars.extra} 超过软上限 1200；如经总编批准请保留，否则削减或拆条目`,
    });
  }

  if (chapter.meta.status !== 'final') {
    issues.push({
      level: 'error',
      chapterId: chapter.id,
      message: `status 为 ${chapter.meta.status}，应为 final`,
    });
  }

  if (chapter.meta.new_terms.length > 8) {
    issues.push({
      level: 'error',
      chapterId: chapter.id,
      message: `new_terms ${chapter.meta.new_terms.length} 个，超过 8 个`,
    });
  }

  const delivery = path.join(CONTENT_DIR, chapter.volumeId, `${chapter.id}_delivery.md`);
  if (!fs.existsSync(delivery)) {
    issues.push({
      level: 'error',
      chapterId: chapter.id,
      message: '缺少交付说明 *_delivery.md',
    });
  }

  const bang = (body.match(/！/g) ?? []).length;
  if (bang > 0) {
    issues.push({
      level: 'error',
      chapterId: chapter.id,
      message: `正文含全角感叹号 ${bang} 个`,
    });
  }

  // 零 HTML（契约 §6.1 / §7.10）：可识别标签形态才报错，`<` 比较符不误报
  const htmlTag = source.match(HTML_TAG_RE);
  if (htmlTag) {
    const line = source.slice(0, htmlTag.index ?? 0).split('\n').length;
    issues.push({
      level: 'error',
      chapterId: chapter.id,
      message: `正文含 HTML 标签（第 ${line} 行）：${htmlTag[0]}`,
    });
  }

  for (const { message } of checkContainers(body)) {
    issues.push({ level: 'error', chapterId: chapter.id, message });
  }

  issues.push(...checkForbidden(source, chapter.id));
  return issues;
}

function checkCrossReferences(chapters: Chapter[]): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set(chapters.map((chapter) => chapter.id));
  const refPattern = /〔(B[1-8])-(C\d{2})〕/g;

  for (const chapter of chapters) {
    const source = chapterSource(ROOT, chapter);
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = refPattern.exec(source)) !== null) {
      const target = `${match[1]}-${match[2]}`;
      if (seen.has(target)) continue;
      seen.add(target);
      if (!ids.has(target)) {
        issues.push({
          level: 'error',
          chapterId: chapter.id,
          message: `交叉引用指向不存在的章节：${target}`,
        });
      }
    }
  }
  return issues;
}

function main(): void {
  const started = performance.now();
  console.log(pc.bold('content:check'));

  let parsed: ParsedSeries;
  try {
    parsed = parseAll(ROOT);
  } catch (error) {
    console.error(pc.red('解析失败：'));
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  const issues: Issue[] = [];
  const chapterIds = new Set<string>();

  for (const volume of parsed.volumes) {
    const actual = volume.chapters.map((chapter) => chapter.id);
    const expected = Array.from(
      { length: volume.volume.expectedChapters },
      (_, index) => `${volume.volume.id}-C${String(index + 1).padStart(2, '0')}`
    );
    for (const id of expected) {
      if (!actual.includes(id)) {
        issues.push({
          level: 'error',
          chapterId: id,
          message: `缺章：${volume.volume.id} 期望 ${volume.volume.expectedChapters} 章`,
        });
      }
    }
    for (const chapter of volume.chapters) {
      if (chapterIds.has(chapter.id)) {
        issues.push({
          level: 'error',
          chapterId: chapter.id,
          message: '章节 id 重复',
        });
      }
      chapterIds.add(chapter.id);
      const source = chapterSource(ROOT, chapter);
      issues.push(...checkChapter(chapter, source));
    }
  }

  issues.push(...checkCrossReferences(parsed.chapters));

  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');

  console.log(
    `  ${pc.cyan('册')} ${parsed.volumes.length}  ${pc.cyan('章')} ${parsed.chapters.length}  ` +
      `${pc.cyan('待核验')} ${parsed.chapters.reduce((sum, chapter) => sum + chapter.stats.verify, 0)}`
  );

  for (const issue of issues) {
    const prefix = issue.level === 'error' ? pc.red('  ✗') : pc.yellow('  !');
    console.log(`${prefix} [${issue.chapterId}] ${issue.message}`);
  }

  const seconds = ((performance.now() - started) / 1000).toFixed(2);
  if (errors.length) {
    console.log(
      pc.bold(pc.red(`失败：${errors.length} 个错误，${warnings.length} 个警告（${seconds}s）`))
    );
    process.exitCode = 1;
  } else {
    console.log(
      pc.bold(
        pc.green(
          `通过：0 个错误，${warnings.length} 个警告（${seconds}s）` +
            (warnings.length ? '；警告不阻塞构建' : '')
        )
      )
    );
  }
}

main();
