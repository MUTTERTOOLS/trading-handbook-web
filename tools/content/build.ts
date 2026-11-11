import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import {
  buildSeriesData,
  chapterSource,
  extractFrontmatter,
  parseAll,
  type ParsedSeries,
} from './parse.js';
import { loadEdition } from './edition.js';
import type {
  Chapter,
  Series,
  SeriesData,
  VolumeContent,
} from '@trading-handbook/content-model';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'content');
const DIST_DIR = path.join(CONTENT_DIR, 'dist');

const NUM_CN: Record<string, string> = {
  B1: '一',
  B2: '二',
  B3: '三',
  B4: '四',
  B5: '五',
  B6: '六',
  B7: '七',
  B8: '八',
};

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeText(file: string, content: string): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content.replace(/\r\n/g, '\n'), 'utf8');
}

function writeJson(file: string, value: unknown): void {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanDist(): void {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);
}

function blockText(chapter: Chapter): string {
  return chapter.blocks
    .map((block) => block.text ?? '')
    .filter(Boolean)
    .join('\n');
}

function verifyItems(root: string, chapter: Chapter): Array<{ context: string }> {
  const source = chapterSource(root, chapter);
  const { body } = extractFrontmatter(source);
  const items: Array<{ context: string }> = [];
  const re = /【待核验】/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const start = Math.max(0, match.index - 45);
    const end = Math.min(body.length, match.index + 45);
    items.push({
      context: body.slice(start, end).replace(/\s+/g, ' ').trim(),
    });
  }
  return items;
}

function compiledVolume(root: string, series: Series, volume: VolumeContent): string {
  const out: string[] = [];
  const num = NUM_CN[volume.volume.id] ?? volume.volume.id;
  out.push(`# 册${num}《${volume.volume.title}》`);
  out.push('');
  out.push(`> **册首风险提示：** ${series.riskNotice}`);
  out.push('>');
  out.push(
    `> 截稿日期：${series.cutoffDate}；规则、费率、税、时间类内容以交易所与券商最新规定为准。各章待核验事项见 \`content/editorial/_meta/06_Verify.md\`。`
  );
  out.push('');
  out.push('## 目录');
  out.push('');
  out.push('| 章 | 标题 |');
  out.push('|---|---|');
  for (const chapter of volume.chapters) {
    out.push(`| ${chapter.id} | ${chapter.title} |`);
  }
  out.push('');
  for (const chapter of volume.chapters) {
    out.push('');
    out.push('---');
    out.push('');
    out.push(chapterSource(root, chapter).trimEnd());
  }
  out.push('');
  out.push('');
  out.push('---');
  out.push('');
  out.push('## 附录：本册新术语索引（按章，自动生成自各章 yaml）');
  out.push('');
  out.push('| 章 | 新术语 |');
  out.push('|---|---|');
  for (const chapter of volume.chapters) {
    if (chapter.meta.new_terms.length) {
      out.push(`| ${chapter.id} | ${chapter.meta.new_terms.join('、')} |`);
    }
  }
  out.push('');
  return out.join('\n');
}

function compiledIndex(series: SeriesData, volumes: VolumeContent[]): string {
  const out: string[] = [];
  out.push(`# ${series.title}总索引`);
  out.push('');
  out.push(
    `> 全丛书 ${series.totals.volumes} 册 ${series.totals.chapters} 章｜约 ${(series.totals.chars / 10000).toFixed(1)} 万字（非空白字符）｜截稿日期：${series.cutoffDate}`
  );
  out.push('> 以下链接指向本目录下的汇编成品；分章原稿位于 content/B1~B8 目录。');
  out.push('');
  for (const volume of volumes) {
    const num = NUM_CN[volume.volume.id] ?? volume.volume.id;
    out.push(`## 册${num}《${volume.volume.title}》—— ${volume.chapters.length} 章`);
    out.push('');
    out.push(`**成品：[compiled/${volume.volume.id}.md](compiled/${volume.volume.id}.md)**`);
    out.push('');
    out.push('| 章 | 标题 |');
    out.push('|---|---|');
    for (const chapter of volume.chapters) {
      out.push(`| ${chapter.id} | ${chapter.title} |`);
    }
    out.push('');
  }
  out.push('---');
  out.push('');
  out.push(
    `**全书合计（汇编成品，非空白字符）：约 ${(series.totals.chars / 10000).toFixed(1)} 万字。**`
  );
  out.push('');
  return out.join('\n');
}

function main(): void {
  const started = performance.now();
  cleanDist();

  const parsed: ParsedSeries = parseAll(ROOT);
  const seriesData = buildSeriesData(parsed.series, parsed.volumes, parsed.chapters);
  const edition = loadEdition(ROOT, parsed.chapters);

  writeJson(path.join(DIST_DIR, 'series.json'), seriesData);
  writeJson(path.join(DIST_DIR, 'edition.json'), edition);

  for (const volume of parsed.volumes) {
    writeJson(path.join(DIST_DIR, 'volumes', `${volume.volume.id}.json`), volume);
    for (const chapter of volume.chapters) {
      writeJson(path.join(DIST_DIR, 'chapters', `${chapter.id}.json`), chapter);
    }
    writeText(
      path.join(DIST_DIR, 'compiled', `${volume.volume.id}.md`),
      compiledVolume(ROOT, parsed.series, volume)
    );
  }

  writeText(
    path.join(DIST_DIR, '00_总索引.md'),
    compiledIndex(seriesData, parsed.volumes)
  );

  const search = parsed.chapters.map((chapter) => ({
    chapterId: chapter.id,
    volumeId: chapter.volumeId,
    title: chapter.title,
    headings: chapter.toc.map((item) => item.label),
    text: blockText(chapter),
  }));
  writeJson(path.join(DIST_DIR, 'search.json'), search);

  const verify = parsed.chapters.map((chapter) => ({
    chapterId: chapter.id,
    volumeId: chapter.volumeId,
    title: chapter.title,
    count: chapter.stats.verify,
    items: verifyItems(ROOT, chapter),
  }));
  writeJson(path.join(DIST_DIR, 'verify.json'), verify);

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    totals: seriesData.totals,
    widgets: Object.values(edition).reduce((sum, placements) => sum + placements.length, 0),
    volumes: parsed.volumes.map((volume) => ({
      id: volume.volume.id,
      title: volume.volume.title,
      ...volume.stats,
    })),
  };
  writeJson(path.join(DIST_DIR, 'build-report.json'), report);

  const secs = ((performance.now() - started) / 1000).toFixed(2);
  console.log(pc.bold(pc.green('content:build 完成')));
  console.log(
    `  ${pc.cyan('册')} ${seriesData.totals.volumes}  ${pc.cyan('章')} ${seriesData.totals.chapters}  ${pc.cyan('字数')} ${(seriesData.totals.chars / 10000).toFixed(1)} 万  ${pc.cyan('绘图说明')} ${seriesData.totals.figures}  ${pc.cyan('待核验')} ${seriesData.totals.verify}  ${pc.cyan('交互')} ${report.widgets}`
  );
  console.log(`  ${pc.dim(`输出：content/dist（${secs}s）`)}`);
}

try {
  main();
} catch (error) {
  console.error(pc.bold(pc.red('content:build 失败')));
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
}
