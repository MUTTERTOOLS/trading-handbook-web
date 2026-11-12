/**
 * 手册内容渲染插件：把内容语法契约（docs/content-grammar.md）转成呈现层标记。
 *
 * 输入约定（由 content:check 保证，插件侧再兜底校验，出错即构建失败）：
 * - 章节固定小节 `## 开场问题` / `一句话结论` / `本章学习目标` / `正文` /
 *   `常见误区` / `本章小结` / `自测题` / `速查卡*` / `延伸与链接` / `⚠️ 风险提示`
 * - `〔B?-C??〕` 交叉引用、`【待核验】` 徽标
 * - `::: interactive <SlotId>` 空容器（槽位清单见 ../slots.ts，未知类型/槽位抛错）
 * - `::: figure-spec` 容器（可折叠制图说明，体内可含列表/引用块）
 * - 误区组以 `**误区…**` 段落开头，自测题组以 `**题 N.**` 段落开头
 * - 站点框架页（index.md / [volume].md）含 `<SeriesHome />` / `<VolumeIntro />`：
 *   `html:false` 下按普通段落进入 token 流，这里转回 html 标签
 *
 * 输出：真实 link token（交叉引用可被静态托管直接访问）+ 少量包裹性
 * html_block，样式全部由 theme/custom.css 按 class / data-section 提供。
 *
 * 刻意不依赖 markdown-it 的类型导出：仓库里同时存在根目录 @types/markdown-it
 * 与 VitePress 内置 markdown-it 两套类型，直接引用会产生双源冲突。
 * 这里用最小结构类型描述用到的 token / state 能力。
 */
import { SLOT_IDS } from '../slots';

interface MdToken {
  type: string;
  tag: string;
  content: string;
  children: MdToken[] | null;
  level: number;
  info: string;
  attrSet(name: string, value: string): void;
}

interface MdBlockTokenizer {
  tokenize(state: MdBlockState, startLine: number, endLine: number): void;
}

interface MdBlockRuler {
  ruler: {
    before(
      beforeName: string,
      name: string,
      rule: (state: MdBlockState, startLine: number, endLine: number, silent: boolean) => boolean,
      alt?: { alt: string[] }
    ): void;
  };
}

interface MdBlockState extends MdState {
  src: string;
  bMarks: number[];
  tShift: number[];
  eMarks: number[];
  sCount: number[];
  blkIndent: number;
  lineMax: number;
  line: number;
  md: { block: MdBlockTokenizer };
}

interface MdState {
  tokens: MdToken[];
  Token: new (type: string, tag: string, nesting: 1 | 0 | -1) => MdToken;
  env: Record<string, unknown>;
}

interface MdLike {
  renderInline(text: string): string;
  core: {
    ruler: {
      push(name: string, rule: (state: MdState) => void): void;
    };
  };
  block: MdBlockRuler;
}

export interface ContentPlugin {
  (md: MdLike): void;
}

const XREF_TOKEN_RE = /〔(B[1-8])-(C\d{2})〕|【待核验】/g;
const FIGURE_SUMMARY = '图示说明（制作提示，读者可跳过）';
const QUIZ_RE = /^\*\*题\s*\d+/;
const MISCONCEPTION_RE = /^\*\*误区/;
const NOTE_RE = /^\*?\*?(注|表注)[：:]/;
const CHEAT_TITLE_RE = /^\*\*[^*]+\*\*$/;
const FORMULA_TEST_RE = /[=＝]/;
const FRAME_COMPONENT_RE = /^<(SeriesHome|VolumeIntro)\s*\/>$/;
/** 容器类型白名单（契约 §5）；未知类型抛错，不得静默透传 */
const CONTAINER_TYPES = new Set(['interactive', 'figure-spec']);
const COLON = 0x3a; // ':'

function envFile(state: MdState): string {
  return ((state.env?.path as string | undefined) ?? (state.env?.relativePath as string | undefined) ?? '未知文件').replace(/\\/g, '/');
}

function htmlToken(state: MdState, content: string): MdToken {
  const token = new state.Token('html_block', '', 0);
  token.content = content;
  return token;
}

function textToken(state: MdState, content: string): MdToken {
  const token = new state.Token('text', '', 0);
  token.content = content;
  return token;
}

/* ------------------------------------------------------------------ *
 * 块级容器规则：`::: <type> [args]` … `:::`
 * 与 markdown-it-container 同构：先把容器边界切成一对 token，
 * 体内交给常规 block 解析；lineMax 收口防止懒续行越过容器边界。
 * 类型与参数的合法性校验统一放在 transformContainers（可拿到文件名报错）。
 * ------------------------------------------------------------------ */
function containerRule(state: MdBlockState, startLine: number, endLine: number, silent: boolean): boolean {
  // 缩进超过 3 空格按代码块处理
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const maxPos = state.eMarks[startLine];
  if (startPos + 3 > maxPos) return false;
  let pos = startPos;
  while (pos < maxPos && state.src.charCodeAt(pos) === COLON) pos++;
  const markerLen = pos - startPos;
  if (markerLen < 3) return false;
  const params = state.src.slice(pos, maxPos).trim();
  // 裸 `:::` 只允许作闭合标记；作打开行时（如缺类型）交由 transformContainers 报错
  const isOpenWithParams = params.length > 0;
  if (!isOpenWithParams) return false;
  if (silent) return true;

  // 找闭合行：行首连续不短于打开标记的冒号，且其后只有空白
  let closeLine = startLine;
  let autoClosed = false;
  for (;;) {
    closeLine++;
    if (closeLine >= endLine) break;
    const lineStart = state.bMarks[closeLine] + state.tShift[closeLine];
    const lineEnd = state.eMarks[closeLine];
    // 负缩进的非空行终止容器（防止吞掉外层列表/引用的后续内容）
    if (lineStart < lineEnd && state.sCount[closeLine] < state.blkIndent) break;
    let p = lineStart;
    while (p < lineEnd && state.src.charCodeAt(p) === COLON) p++;
    if (p - lineStart >= markerLen && !state.src.slice(p, lineEnd).trim()) {
      autoClosed = true;
      break;
    }
  }

  const oldLineMax = state.lineMax;
  state.lineMax = closeLine;
  const open = new state.Token('thb_container_open', 'div', 1);
  open.info = params;
  state.tokens.push(open);
  state.md.block.tokenize(state, startLine + 1, closeLine);
  const close = new state.Token('thb_container_close', 'div', -1);
  state.tokens.push(close);
  state.lineMax = oldLineMax;
  state.line = autoClosed ? closeLine + 1 : endLine;
  return true;
}

/** 容器 token → 呈现标记；未知类型 / 未知槽位 / 非法形态抛错（构建期失败） */
function transformContainers(state: MdState, tokens: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  const opens: Array<{ info: string; inner: MdToken[] }> = [];
  for (const token of tokens) {
    if (token.type === 'thb_container_open') {
      opens.push({ info: token.info, inner: [] });
      continue;
    }
    if (token.type === 'thb_container_close') {
      const open = opens.pop();
      if (!open) {
        throw new Error(`${envFile(state)}：容器闭合 ::: 缺少打开行`);
      }
      const parts = open.info.trim().split(/\s+/);
      const [type, ...args] = parts;
      if (!CONTAINER_TYPES.has(type!)) {
        throw new Error(
          `${envFile(state)}：未知容器类型 "${type}"（仅允许 interactive / figure-spec）`
        );
      }
      if (type === 'interactive') {
        const slotId = args[0];
        if (args.length !== 1 || !(SLOT_IDS as readonly string[]).includes(slotId!)) {
          throw new Error(
            `${envFile(state)}：interactive 槽位 id 非法 "${open.info.trim()}"（冻结清单：${SLOT_IDS.join(' / ')}）`
          );
        }
        if (open.inner.length) {
          throw new Error(`${envFile(state)}：interactive 容器体内必须为空（契约 §5.1）`);
        }
        // 组件标签由槽位注册表（theme/index.ts）按同一 id 注册后解析
        result.push(htmlToken(state, `<${slotId} />`));
        continue;
      }
      // figure-spec：可折叠制图说明，体内正常 markdown 渲染
      if (args.length) {
        throw new Error(`${envFile(state)}：figure-spec 容器不接受参数`);
      }
      result.push(htmlToken(state, `<details class="figure-note"><summary>${FIGURE_SUMMARY}</summary><div>`));
      result.push(...open.inner);
      result.push(htmlToken(state, '</div></details>'));
      continue;
    }
    if (opens.length) {
      opens[opens.length - 1]!.inner.push(token);
    } else {
      result.push(token);
    }
  }
  if (opens.length) {
    throw new Error(`${envFile(state)}：容器 "${opens[0]!.info}" 未闭合`);
  }
  return result;
}

/** 站点框架页组件：`html:false` 下是普通文本段落，这里转回组件标签 */
function transformFrameComponents(state: MdState, tokens: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (isTopParagraph(tokens, i)) {
      const text = paragraphText(tokens, i);
      const match = text.match(FRAME_COMPONENT_RE);
      if (match) {
        result.push(htmlToken(state, `<${match[1]} />`));
        i += 2;
        continue;
      }
    }
    result.push(token);
  }
  return result;
}

/** 跳过 code_inline，防止代码示例里的示例语法被误转换 */
function transformInline(state: MdState, children: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  for (const token of children) {
    if (token.type !== 'text') {
      result.push(token);
      continue;
    }
    const content = token.content;
    if (!/〔B[1-8]-C\d{2}〕|【待核验】/.test(content)) {
      result.push(token);
      continue;
    }
    XREF_TOKEN_RE.lastIndex = 0;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = XREF_TOKEN_RE.exec(content)) !== null) {
      if (match.index > last) {
        result.push(textToken(state, content.slice(last, match.index)));
      }
      if (match[1] && match[2]) {
        // 契约目标路由：/b{n}/c{nn}.html（rewrite 后真实存在，死链检查通过）
        const volumeSlug = match[1].toLowerCase();
        const chapterNo = match[2].slice(1).toLowerCase();
        const open = new state.Token('link_open', 'a', 1);
        open.attrSet('href', `/${volumeSlug}/c${chapterNo}.html`);
        open.attrSet('class', 'xref');
        result.push(open, textToken(state, match[0]), new state.Token('link_close', 'a', -1));
      } else {
        const badge = new state.Token('html_inline', '', 0);
        badge.content = '<span class="verify-badge">【待核验】</span>';
        result.push(badge);
      }
      last = XREF_TOKEN_RE.lastIndex;
    }
    if (last < content.length) {
      result.push(textToken(state, content.slice(last)));
    }
  }
  return result;
}

function paragraphText(tokens: MdToken[], openIndex: number): string {
  const inline = tokens[openIndex + 1];
  return inline && inline.type === 'inline' ? inline.content : '';
}

function isTopParagraph(tokens: MdToken[], index: number): boolean {
  return tokens[index]!.type === 'paragraph_open' && tokens[index]!.level === 0;
}

function findClose(tokens: MdToken[], start: number, closeType: string): number {
  const openType = closeType.replace(/_close$/, '_open');
  let depth = 0;
  for (let i = start + 1; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.type === closeType) {
      if (depth === 0) return i;
      depth--;
    } else if (token.type === openType) {
      depth++;
    }
  }
  throw new Error(`未闭合的 token：${closeType}`);
}

/** 速查卡内纯加粗段落 → 卡片小标题；`注：` 段落 → 表注 */
function classifyParagraphs(tokens: MdToken[]): void {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (!isTopParagraph(tokens, i)) continue;
    const text = paragraphText(tokens, i);
    if (CHEAT_TITLE_RE.test(text)) {
      token.attrSet('class', 'cc-title');
    } else if (NOTE_RE.test(text)) {
      token.attrSet('class', 'table-note');
    }
  }
}

/** 自测题组：题面进 summary，答案进折叠体 */
function transformQuizzes(state: MdState, tokens: MdToken[]): MdToken[] {
  const groupStarts: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (isTopParagraph(tokens, i) && QUIZ_RE.test(paragraphText(tokens, i))) {
      groupStarts.push(i);
    }
  }
  if (!groupStarts.length) return tokens;

  const result: MdToken[] = [];
  let cursor = 0;
  for (let g = 0; g < groupStarts.length; g++) {
    const start = groupStarts[g]!;
    const end = g + 1 < groupStarts.length ? groupStarts[g + 1]! : tokens.length;
    result.push(...tokens.slice(cursor, start));
    result.push(htmlToken(state, '<details class="quiz"><summary><div class="quiz-question">'));
    result.push(tokens[start]!, tokens[start + 1]!, tokens[start + 2]!);
    result.push(htmlToken(state, '</div></summary><div class="quiz-body">'));
    result.push(...tokens.slice(start + 3, end));
    result.push(htmlToken(state, '</div></details>'));
    cursor = end;
  }
  result.push(...tokens.slice(cursor));
  return result;
}

/** 误区组：`**误区…**` 段落变成标注标题，其余内容包进 warn callout */
function transformMisconceptions(md: MdLike, state: MdState, tokens: MdToken[]): MdToken[] {
  const groupStarts: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (isTopParagraph(tokens, i) && MISCONCEPTION_RE.test(paragraphText(tokens, i))) {
      groupStarts.push(i);
    }
  }
  if (!groupStarts.length) return tokens;

  const result: MdToken[] = [];
  let cursor = 0;
  for (let g = 0; g < groupStarts.length; g++) {
    const start = groupStarts[g]!;
    const end = g + 1 < groupStarts.length ? groupStarts[g + 1]! : tokens.length;
    result.push(...tokens.slice(cursor, start));
    const head = paragraphText(tokens, start)
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .trim();
    result.push(
      htmlToken(state, `<div class="callout callout-warn"><div class="callout-title">${md.renderInline(head)}</div>`)
    );
    result.push(...tokens.slice(start + 3, end));
    result.push(htmlToken(state, '</div>'));
    cursor = end;
  }
  result.push(...tokens.slice(cursor));
  return result;
}

/** 公式引用块与表格的 class / 滚动容器 */
function transformBlocks(state: MdState, tokens: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i]!;
    if (token.type === 'blockquote_open' && token.level === 0) {
      const close = findClose(tokens, i, 'blockquote_close');
      const text = tokens
        .slice(i, close)
        .filter((t) => t.type === 'inline')
        .map((t) => t.content)
        .join(' ');
      if (text.length < 220 && FORMULA_TEST_RE.test(text)) {
        token.attrSet('class', 'formula-block');
      }
    }
    if (token.type === 'table_open') {
      token.attrSet('class', 'data-table');
      if (token.level === 0) {
        const close = findClose(tokens, i, 'table_close');
        result.push(htmlToken(state, '<div class="table-scroll">'));
        result.push(...tokens.slice(i, close + 1));
        result.push(htmlToken(state, '</div>'));
        i = close + 1;
        continue;
      }
    }
    result.push(token);
    i++;
  }
  return result;
}

interface Section {
  title: string;
  headingFrom: number;
  bodyFrom: number;
  to: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const contentPlugin: ContentPlugin = (md) => {
  md.block.ruler.before('fence', 'thb_container', containerRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.core.ruler.push('thb_handbook_content', (state) => {
    let tokens = state.tokens;

    // 1. 行内转换：交叉引用 → 链接；【待核验】→ 徽标
    for (const token of tokens) {
      if (token.type === 'inline' && token.children) {
        token.children = transformInline(state, token.children);
      }
    }

    // 2. 容器与站点框架组件 → 呈现标记（未知容器类型 / 槽位在此抛错）
    tokens = transformContainers(state, tokens);
    tokens = transformFrameComponents(state, tokens);

    // 3. 全局块级 class：h3/h4 小节标题
    for (const token of tokens) {
      if (token.type !== 'heading_open') continue;
      if (token.tag === 'h3') token.attrSet('class', 'sub-title');
      if (token.tag === 'h4') token.attrSet('class', 'sub-sub-title');
    }

    // 4. 切分 h2 小节
    const sections: Section[] = [];
    let current: Section | null = null;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;
      if (token.type === 'heading_open' && token.tag === 'h2') {
        if (current) {
          current.to = i;
          sections.push(current);
        }
        const title = tokens[i + 1]?.content.trim() ?? '';
        current = { title, headingFrom: i, bodyFrom: i + 3, to: tokens.length };
        i += 2;
      }
    }
    if (current) sections.push(current);

    const result: MdToken[] = [];

    // 5. 章节页头（frontmatter 驱动，不进 outline）
    const fm = state.env?.frontmatter as Record<string, unknown> | undefined;
    const envPath = ((state.env?.path as string | undefined) ?? '').replace(/\\/g, '/');
    const chapterId = typeof fm?.chapter_id === 'string' ? fm.chapter_id : '';
    const title = typeof fm?.title === 'string' ? fm.title : '';
    // env.path 可能是绝对源文件路径或 rewrite 后的相对路径，统一按路径段匹配 Bn/
    if (/(?:^|\/)b\d\//i.test(envPath) && title) {
      const metaParts = [`对应 ${chapterId}`];
      if (Array.isArray(fm?.new_terms) && fm.new_terms.length) {
        metaParts.push(`新术语 ${(fm.new_terms as string[]).length} 个`);
      }
      result.push(
        htmlToken(
          state,
          `<header class="chapter-head"><h1 class="chapter-title">${escapeHtml(title)}</h1>` +
            `<p class="chapter-meta">${escapeHtml(metaParts.join(' · '))}</p></header>`
        )
      );
    }

    // 6. 逐节应用语义转换并包上 data-section 容器
    for (const section of sections) {
      let body = tokens.slice(section.bodyFrom, section.to);
      classifyParagraphs(body);
      if (section.title === '自测题') body = transformQuizzes(state, body);
      if (section.title === '常见误区') body = transformMisconceptions(md, state, body);
      body = transformBlocks(state, body);
      result.push(tokens[section.headingFrom]!, tokens[section.headingFrom + 1]!, tokens[section.headingFrom + 2]!);
      result.push(htmlToken(state, `<div class="sec" data-section="${escapeHtml(section.title)}">`));
      result.push(...body);
      result.push(htmlToken(state, '</div>'));
    }

    // 前导内容（章节应有 frontmatter；框架页无 h2 小节，全部原样保留）
    const firstSectionFrom = sections[0]?.headingFrom ?? tokens.length;
    if (firstSectionFrom > 0) {
      result.unshift(...tokens.slice(0, firstSectionFrom));
    }

    state.tokens = result;
  });
};

export default contentPlugin;
