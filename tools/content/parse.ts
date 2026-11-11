import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import YAML from 'yaml';
import {
  ChapterFrontmatterSchema,
  SeriesSchema,
  type Block,
  type Chapter,
  type ChapterStats,
  type Series,
  type SeriesData,
  type SeriesVolume,
  type TocItem,
  type VolumeContent,
  type VolumeId,
  type VolumeStats,
  type ChapterSummary,
} from '@trading-handbook/content-model';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false,
});

const FRONTMATTER_RE = /^```yaml\r?\n---\r?\n([\s\S]*?)\r?\n---\r?\n```\r?\n?/;

interface ParseContext {
  chapterId: string;
  env: Record<string, unknown>;
  headingCounter: number;
  figureCounter: number;
  toc: TocItem[];
}

export interface ParsedSeries {
  series: Series;
  volumes: VolumeContent[];
  chapters: Chapter[];
}

export interface ChapterSource {
  source: string;
  body: string;
}

function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
}

export function extractFrontmatter(source: string): { yamlText: string; body: string } {
  const normalized = normalizeNewlines(source);
  const match = normalized.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error('章节缺少 ```yaml 围栏 frontmatter');
  }
  return {
    yamlText: match[1]!,
    body: normalized.slice(match[0].length),
  };
}

export function loadSeries(root: string): Series {
  const file = path.join(root, 'content', 'series.yaml');
  const parsed = YAML.parse(fs.readFileSync(file, 'utf8'));
  return SeriesSchema.parse(parsed);
}

function discoverChapterFiles(root: string, volume: SeriesVolume): string[] {
  const dir = path.join(root, 'content', volume.id);
  if (!fs.existsSync(dir)) {
    throw new Error(`缺少分册目录：${dir}`);
  }
  const files = fs
    .readdirSync(dir)
    .filter((name) => new RegExp(`^${volume.id}-C\\d{2}\\.md$`).test(name))
    .sort((a, b) => a.localeCompare(b, 'en'));
  if (files.length !== volume.expectedChapters) {
    throw new Error(
      `${volume.id} 章节数不符：期望 ${volume.expectedChapters}，实际 ${files.length}`
    );
  }
  return files.map((name) => path.join(dir, name));
}

function findClose(tokens: Token[], start: number, closeType: string): number {
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

function renderInline(ctx: ParseContext, tokens: Token[]): string {
  const flat = tokens.flatMap((token) =>
    token.type === 'inline' && token.children ? token.children : [token]
  );
  return md.renderer.renderInline(flat, md.options, ctx.env);
}

function renderTokens(ctx: ParseContext, tokens: Token[], start: number, end: number): string {
  return md.renderer.render(tokens.slice(start, end), md.options, ctx.env);
}

export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function transformHtml(html: string): string {
  return html
    .split(/(<code[\s\S]*?<\/code>)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part
        .replace(
          /〔(B[1-8])-(C\d{2})〕/g,
          (_all, volume: string, chapter: string) =>
            `<a class="xref" href="./${volume.toLowerCase()}.html#${volume.toLowerCase()}-${chapter.toLowerCase()}">〔${volume}-${chapter}〕</a>`
        )
        .replace(/【待核验】/g, '<span class="verify-badge">【待核验】</span>');
    })
    .join('');
}

function isFigureParagraph(text: string): boolean {
  return /^绘图说明/.test(text.replace(/^[*_\s]+/, ''));
}

function parseBlocks(tokens: Token[], start: number, end: number, ctx: ParseContext): Block[] {
  const blocks: Block[] = [];
  let i = start;

  while (i < end) {
    const token = tokens[i]!;

    if (token.type === 'heading_open') {
      const close = findClose(tokens, i, 'heading_close');
      const inline = tokens[i + 1];
      let html = inline ? transformHtml(renderInline(ctx, [inline])) : '';
      let text = inline ? plainText(html) : '';
      let id = '';
      const explicit = text.match(/\s*\{#([\w-]+)\}\s*$/);
      if (explicit) {
        id = explicit[1]!;
        text = text.replace(/\s*\{#[\w-]+\}\s*$/, '').trim();
        html = html.replace(/\s*\{#[\w-]+\}\s*$/, '').trim();
      }
      if (!id) {
        id = `${ctx.chapterId.toLowerCase()}-s${++ctx.headingCounter}`;
      }
      const depth = token.tag === 'h4' ? 4 : 3;
      blocks.push({ type: 'heading', depth, id, html, text });
      ctx.toc.push({ id, label: text, depth: 3 });
      i = close + 1;
      continue;
    }

    if (token.type === 'paragraph_open') {
      const close = findClose(tokens, i, 'paragraph_close');
      const inline = tokens[i + 1];
      const html = inline ? transformHtml(renderInline(ctx, [inline])) : '';
      const text = inline ? plainText(html) : '';
      if (isFigureParagraph(text)) {
        const id = `${ctx.chapterId.toLowerCase()}-fig${++ctx.figureCounter}`;
        blocks.push({ type: 'figure', id, specHtml: html, text });
      } else {
        blocks.push({ type: 'paragraph', html, text });
      }
      i = close + 1;
      continue;
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const closeType = token.type === 'bullet_list_open' ? 'bullet_list_close' : 'ordered_list_close';
      const close = findClose(tokens, i, closeType);
      const html = transformHtml(renderTokens(ctx, tokens, i, close + 1));
      blocks.push({
        type: 'list',
        ordered: token.type === 'ordered_list_open',
        html,
        text: plainText(html),
      });
      i = close + 1;
      continue;
    }

    if (token.type === 'table_open') {
      const close = findClose(tokens, i, 'table_close');
      const html = transformHtml(renderTokens(ctx, tokens, i, close + 1)).replace(
        /<table>/,
        '<table class="data-table">'
      );
      blocks.push({ type: 'table', html, text: plainText(html) });
      i = close + 1;
      continue;
    }

    if (token.type === 'blockquote_open') {
      const close = findClose(tokens, i, 'blockquote_close');
      const html = transformHtml(renderTokens(ctx, tokens, i, close + 1));
      blocks.push({ type: 'blockquote', html, text: plainText(html) });
      i = close + 1;
      continue;
    }

    if (token.type === 'fence' || token.type === 'code_block') {
      const html = renderTokens(ctx, tokens, i, i + 1);
      blocks.push({ type: 'code', html, text: token.content.trim() });
      i++;
      continue;
    }

    if (token.type === 'html_block') {
      blocks.push({ type: 'html', html: transformHtml(token.content), text: plainText(token.content) });
      i++;
      continue;
    }

    if (token.type === 'hr') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    i++;
  }

  return blocks;
}

function parseMarkdown(ctx: ParseContext, source: string): Block[] {
  const tokens = md.parse(source, ctx.env);
  return parseBlocks(tokens, 0, tokens.length, ctx);
}

function splitSections(body: string): Array<{ title: string; content: string }> {
  const lines = body.split('\n');
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } = { title: '', lines: [] };
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && /^##\s+/.test(line)) {
      if (current.title || current.lines.some((l) => l.trim())) {
        sections.push(current);
      }
      current = { title: line.replace(/^##\s+/, '').trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title || current.lines.some((l) => l.trim())) {
    sections.push(current);
  }

  return sections
    .map((section) => ({
      title: section.title,
      content: section.lines.join('\n').trim(),
    }))
    .filter((section) => section.title || section.content);
}

function extractListItems(ctx: ParseContext, source: string): string[] {
  const tokens = md.parse(source, ctx.env);
  const items: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.type !== 'list_item_open' || token.level !== 1) continue;
    const parts: string[] = [];
    let j = i + 1;
    while (j < tokens.length) {
      const current = tokens[j]!;
      if (current.type === 'list_item_close' && current.level === 1) break;
      if (current.type === 'inline') {
        parts.push(renderInline(ctx, [current]));
      }
      j++;
    }
    items.push(parts.join(' '));
    i = j;
  }
  return items;
}

function splitGroups(source: string, start: RegExp): string[] {
  return source
    .split(start)
    .map((group) => group.trim())
    .filter(Boolean);
}

function splitHead(group: string): { head: string; rest: string } {
  const lines = group.split('\n');
  const head = (lines.shift() ?? '').trim();
  return { head, rest: lines.join('\n').trim() };
}

function sectionBlock(
  ctx: ParseContext,
  suffix: string,
  title: string,
  blocks: Block[],
  withToc = true
): Block {
  const id = `${ctx.chapterId.toLowerCase()}-${suffix}`;
  if (withToc && title) {
    ctx.toc.push({ id, label: title, depth: 2 });
  }
  return {
    type: 'section',
    id,
    title,
    blocks,
    text: [title, ...blocks.map((block) => block.text ?? '')].filter(Boolean).join(' '),
  };
}

function parseOpening(ctx: ParseContext, content: string): Block {
  return {
    type: 'opening',
    blocks: parseMarkdown(ctx, content),
    text: plainText(md.render(content, ctx.env)),
  };
}

function parseKey(ctx: ParseContext, content: string): Block {
  const blocks = parseMarkdown(ctx, content);
  return {
    type: 'callout',
    variant: 'key',
    title: '一句话结论',
    blocks,
    text: `一句话结论 ${blocks.map((block) => block.text ?? '').join(' ')}`,
  };
}

function parseGoals(ctx: ParseContext, content: string): Block {
  const items = extractListItems(ctx, content);
  return {
    type: 'goals',
    items: items.length ? items : [md.render(content, ctx.env)],
    text: plainText(md.render(content, ctx.env)),
  };
}

function parseMisconceptions(ctx: ParseContext, content: string): Block {
  const groups = splitGroups(content, /(?=^\*\*误区)/m);
  const callouts: Block[] = [];
  for (const group of groups) {
    const { head, rest } = splitHead(group);
    if (!head) continue;
    const titleHtml = transformHtml(md.renderInline(head, ctx.env));
    const title = plainText(titleHtml);
    const blocks = parseMarkdown(ctx, rest);
    callouts.push({
      type: 'callout',
      variant: 'warn',
      title,
      blocks,
      text: `${title} ${blocks.map((block) => block.text ?? '').join(' ')}`,
    });
  }
  const blocks = callouts.length ? callouts : parseMarkdown(ctx, content);
  return sectionBlock(ctx, 'm', '常见误区', blocks);
}

function parseSummary(ctx: ParseContext, content: string): Block {
  const items = extractListItems(ctx, content);
  const blocks: Block[] = items.length
    ? [{ type: 'summary', items, text: plainText(md.render(content, ctx.env)) }]
    : parseMarkdown(ctx, content);
  return sectionBlock(ctx, 'summary', '本章小结', blocks);
}

function parseQuiz(ctx: ParseContext, content: string): Block {
  const groups = splitGroups(content, /(?=^\*\*题\s*\d+)/m);
  const quizzes: Block[] = [];

  for (const group of groups) {
    const marker = group.search(/\*\*答案与解析[：:]\*\*/);
    let questionMd = group;
    let answerMd = '';
    let answerLabel = false;
    if (marker >= 0) {
      questionMd = group.slice(0, marker);
      answerMd = group
        .slice(marker)
        .replace(/^\s*\*\*答案与解析[：:]\*\*\s*/, '');
      answerLabel = true;
    } else {
      const parts = group.split(/\n\s*\n/);
      questionMd = parts.shift() ?? '';
      answerMd = parts.join('\n\n');
    }
    const questionHtml = transformHtml(md.render(questionMd.trim(), ctx.env));
    const answerBlocks = parseMarkdown(ctx, answerMd.trim());
    quizzes.push({
      type: 'quiz',
      questionHtml,
      answerBlocks,
      answerLabel,
      text: `${plainText(questionHtml)} ${answerBlocks.map((block) => block.text ?? '').join(' ')}`,
    });
  }

  const blocks = quizzes.length ? quizzes : parseMarkdown(ctx, content);
  return sectionBlock(ctx, 'z', '自测题', blocks);
}

function parseCheat(ctx: ParseContext, content: string): Block {
  const html = transformHtml(md.render(content, ctx.env)).replace(
    /<p><strong>([\s\S]*?)<\/strong><\/p>/g,
    '<div class="cc-title">$1</div>'
  );
  return sectionBlock(ctx, 'c', '速查卡', [
    { type: 'cheat', html, text: plainText(html) },
  ]);
}

function parseLinks(ctx: ParseContext, content: string): Block {
  const items = extractListItems(ctx, content);
  const blocks: Block[] = items.length
    ? [{ type: 'links', items, text: plainText(md.render(content, ctx.env)) }]
    : parseMarkdown(ctx, content);
  return sectionBlock(ctx, 'ext', '延伸与链接', blocks, false);
}

function parseRisk(ctx: ParseContext, content: string): Block {
  const html = transformHtml(md.render(content, ctx.env));
  return sectionBlock(ctx, 'risk', '', [{ type: 'risk', html, text: plainText(html) }], false);
}

function parseGenericSection(
  ctx: ParseContext,
  index: number,
  title: string,
  content: string
): Block {
  const id = `${ctx.chapterId.toLowerCase()}-x${index}`;
  ctx.toc.push({ id, label: title, depth: 2 });
  const blocks = parseMarkdown(ctx, content);
  return {
    type: 'section',
    id,
    title,
    blocks,
    text: [title, ...blocks.map((block) => block.text ?? '')].filter(Boolean).join(' '),
  };
}

function countBlocks(blocks: Block[], predicate: (block: Block) => boolean): number {
  let count = 0;
  for (const block of blocks) {
    if (predicate(block)) count++;
    if (block.type === 'callout' || block.type === 'opening' || block.type === 'section') {
      count += countBlocks(block.blocks, predicate);
    } else if (block.type === 'quiz') {
      count += countBlocks(block.answerBlocks, predicate);
    }
  }
  return count;
}

export function parseChapter(volume: SeriesVolume, file: string): Chapter {
  const source = fs.readFileSync(file, 'utf8');
  const { yamlText, body } = extractFrontmatter(source);
  const meta = ChapterFrontmatterSchema.parse(YAML.parse(yamlText));
  if (meta.chapter_id !== path.basename(file, '.md')) {
    throw new Error(`${file} 的 chapter_id ${meta.chapter_id} 与文件名不一致`);
  }
  if (!meta.chapter_id.startsWith(`${volume.id}-`)) {
    throw new Error(`${file} 的 chapter_id 不属于 ${volume.id}`);
  }

  const ctx: ParseContext = {
    chapterId: meta.chapter_id,
    env: {},
    headingCounter: 0,
    figureCounter: 0,
    toc: [],
  };

  const sections = splitSections(body);
  const blocks: Block[] = [];
  let genericIndex = 0;

  for (const section of sections) {
    const title = section.title;
    const content = section.content;
    if (title === '开场问题') {
      blocks.push(parseOpening(ctx, content));
    } else if (title === '一句话结论') {
      blocks.push(parseKey(ctx, content));
    } else if (title === '本章学习目标') {
      blocks.push(parseGoals(ctx, content));
    } else if (title === '正文') {
      blocks.push(...parseMarkdown(ctx, content));
    } else if (title === '常见误区') {
      blocks.push(parseMisconceptions(ctx, content));
    } else if (title === '本章小结') {
      blocks.push(parseSummary(ctx, content));
    } else if (title === '自测题') {
      blocks.push(parseQuiz(ctx, content));
    } else if (title.startsWith('速查卡')) {
      blocks.push(parseCheat(ctx, content));
    } else if (title === '延伸与链接') {
      blocks.push(parseLinks(ctx, content));
    } else if (title.includes('风险提示')) {
      blocks.push(parseRisk(ctx, content));
    } else if (title) {
      blocks.push(parseGenericSection(ctx, ++genericIndex, title, content));
    }
  }

  const bodyHtml = md.render(body, ctx.env);
  const stats: ChapterStats = {
    chars: plainText(bodyHtml).replace(/\s/g, '').length,
    figures: countBlocks(blocks, (block) => block.type === 'figure'),
    verify: (body.match(/【待核验】/g) ?? []).length,
    quizzes: countBlocks(blocks, (block) => block.type === 'quiz'),
    misconceptions: countBlocks(
      blocks,
      (block) => block.type === 'callout' && block.variant === 'warn'
    ),
  };

  return {
    id: meta.chapter_id,
    volumeId: volume.id,
    slug: meta.chapter_id.toLowerCase(),
    title: meta.title,
    meta,
    blocks,
    toc: ctx.toc,
    stats,
  };
}

export function parseAll(root: string): ParsedSeries {
  const series = loadSeries(root);
  const volumes: VolumeContent[] = [];
  const chapters: Chapter[] = [];
  const seen = new Set<string>();

  for (const volume of series.volumes) {
    const files = discoverChapterFiles(root, volume);
    const volumeChapters = files.map((file) => parseChapter(volume, file));
    for (const chapter of volumeChapters) {
      if (seen.has(chapter.id)) throw new Error(`重复章节 id：${chapter.id}`);
      seen.add(chapter.id);
      chapters.push(chapter);
    }
    const stats: VolumeStats = {
      chapters: volumeChapters.length,
      chars: volumeChapters.reduce((sum, chapter) => sum + chapter.stats.chars, 0),
      figures: volumeChapters.reduce((sum, chapter) => sum + chapter.stats.figures, 0),
      verify: volumeChapters.reduce((sum, chapter) => sum + chapter.stats.verify, 0),
      quizzes: volumeChapters.reduce((sum, chapter) => sum + chapter.stats.quizzes, 0),
      misconceptions: volumeChapters.reduce(
        (sum, chapter) => sum + chapter.stats.misconceptions,
        0
      ),
    };
    volumes.push({ volume, chapters: volumeChapters, stats });
  }

  return { series, volumes, chapters };
}

export function buildSeriesData(
  series: Series,
  volumes: VolumeContent[],
  chapters: Chapter[]
): SeriesData {
  const volumeSummaries = volumes.map(({ volume, chapters: volumeChapters }) => ({
    ...volume,
    chapters: volumeChapters.map<ChapterSummary>((chapter) => ({
      id: chapter.id,
      slug: chapter.slug,
      title: chapter.title,
      status: chapter.meta.status,
      chars: chapter.stats.chars,
      figures: chapter.stats.figures,
      verify: chapter.stats.verify,
      constants: chapter.meta.constants_used,
    })),
  }));

  return {
    title: series.title,
    version: series.version,
    cutoffDate: series.cutoffDate,
    riskNotice: series.riskNotice,
    generatedAt: new Date().toISOString(),
    totals: {
      volumes: volumes.length,
      chapters: chapters.length,
      chars: chapters.reduce((sum, chapter) => sum + chapter.stats.chars, 0),
      figures: chapters.reduce((sum, chapter) => sum + chapter.stats.figures, 0),
      verify: chapters.reduce((sum, chapter) => sum + chapter.stats.verify, 0),
    },
    volumes: volumeSummaries,
  };
}

export function chapterSource(root: string, chapter: Chapter): string {
  return fs.readFileSync(path.join(root, 'content', chapter.volumeId, `${chapter.id}.md`), 'utf8');
}

export function volumeById(volumes: VolumeContent[], id: VolumeId): VolumeContent {
  const found = volumes.find((volume) => volume.volume.id === id);
  if (!found) throw new Error(`找不到分册 ${id}`);
  return found;
}
