/**
 * 手册内容渲染插件：把原 parse.ts 的章节语义移植成 markdown-it 转换。
 *
 * 输入约定（由 content:check 保证）：
 * - 章节固定小节 `## 开场问题` / `一句话结论` / `本章学习目标` / `正文` /
 *   `常见误区` / `本章小结` / `自测题` / `速查卡*` / `延伸与链接` / `⚠️ 风险提示`
 * - `〔B?-C??〕` 交叉引用、`【待核验】` 徽标、`绘图说明` 段落
 * - 误区组以 `**误区…**` 段落开头，自测题组以 `**题 N.**` 段落开头
 *
 * 输出：真实 link token（交叉引用可被静态托管直接访问）+ 少量包裹性
 * html_block，样式全部由 theme/custom.css 按 class / data-section 提供。
 *
 * 刻意不依赖 markdown-it 的类型导出：仓库里同时存在根目录 @types/markdown-it
 * 与 VitePress 内置 markdown-it 两套类型，直接引用会产生双源冲突。
 * 这里用最小结构类型描述用到的 token / state 能力。
 */
interface MdToken {
  type: string;
  tag: string;
  content: string;
  children: MdToken[] | null;
  level: number;
  attrSet(name: string, value: string): void;
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
        const volumeSlug = match[1].toLowerCase();
        const chapterId = `${match[1]}-${match[2]}`.toLowerCase();
        const open = new state.Token('link_open', 'a', 1);
        open.attrSet('href', `/${volumeSlug}/${chapterId}.html`);
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

/** 绘图说明段落 → 可折叠 details */
function transformFigures(state: MdState, tokens: MdToken[]): MdToken[] {
  const result: MdToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (isTopParagraph(tokens, i)) {
      const text = paragraphText(tokens, i).replace(/^[*_\s]+/, '');
      if (/^绘图说明/.test(text)) {
        result.push(htmlToken(state, `<details class="figure-note"><summary>${FIGURE_SUMMARY}</summary>`));
        result.push(token, tokens[i + 1]!, tokens[i + 2]!);
        result.push(htmlToken(state, '</details>'));
        i += 2;
        continue;
      }
    }
    result.push(token);
  }
  return result;
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
  md.core.ruler.push('thb_handbook_content', (state) => {
    const tokens = state.tokens;

    // 1. 行内转换：交叉引用 → 链接；【待核验】→ 徽标
    for (const token of tokens) {
      if (token.type === 'inline' && token.children) {
        token.children = transformInline(state, token.children);
      }
    }

    // 2. 全局块级 class：h3/h4 小节标题
    for (const token of tokens) {
      if (token.type !== 'heading_open') continue;
      if (token.tag === 'h3') token.attrSet('class', 'sub-title');
      if (token.tag === 'h4') token.attrSet('class', 'sub-sub-title');
    }

    // 3. 切分 h2 小节
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

    // 4. 章节页头（frontmatter 驱动，不进 outline）
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

    // 5. 逐节应用语义转换并包上 data-section 容器
    for (const section of sections) {
      let body = tokens.slice(section.bodyFrom, section.to);
      body = transformFigures(state, body);
      classifyParagraphs(body);
      if (section.title === '自测题') body = transformQuizzes(state, body);
      if (section.title === '常见误区') body = transformMisconceptions(md, state, body);
      body = transformBlocks(state, body);
      result.push(tokens[section.headingFrom]!, tokens[section.headingFrom + 1]!, tokens[section.headingFrom + 2]!);
      result.push(htmlToken(state, `<div class="sec" data-section="${escapeHtml(section.title)}">`));
      result.push(...body);
      result.push(htmlToken(state, '</div>'));
    }

    // 前导内容（不应有，但保底保留）
    const firstSectionFrom = sections[0]?.headingFrom ?? tokens.length;
    if (firstSectionFrom > 0) {
      result.unshift(...tokens.slice(0, firstSectionFrom));
    }

    state.tokens = result;
  });
};

export default contentPlugin;
