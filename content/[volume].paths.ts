import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

/** 定位 content/：paths.ts 会被打包执行，import.meta.url 不可靠，按候选目录探测 */
function findContentDir(): string {
  const candidates = [
    fileURLToPath(new URL('./', import.meta.url)),
    path.resolve(process.cwd(), '../../content'),
    path.resolve(process.cwd(), 'content'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'series.yaml'))) return dir;
  }
  throw new Error(`找不到 content 目录，尝试过：${candidates.join(' , ')}`);
}

const CONTENT_DIR = findContentDir();

interface SeriesVolumeYaml {
  id: string;
  slug: string;
  title: string;
  expectedChapters: number;
}

/** 生成分册页正文的章节目录（构建期读 series.yaml 与各章 frontmatter title） */
function chapterList(volume: SeriesVolumeYaml): string {
  const items: string[] = [];
  for (let i = 1; i <= volume.expectedChapters; i++) {
    const chapterId = `${volume.id}-C${String(i).padStart(2, '0')}`;
    const source = fs.readFileSync(path.join(CONTENT_DIR, volume.id, `${chapterId}.md`), 'utf8');
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    const title = frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? chapterId;
    items.push(`- [§${i} ${title}](/${volume.slug}/${chapterId.toLowerCase()}.html)`);
  }
  return `本册共 ${volume.expectedChapters} 章，按顺序阅读：\n\n${items.join('\n')}\n`;
}

export default {
  watch: ['series.yaml', 'B*/B*.md'],
  paths() {
    const series = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, 'series.yaml'), 'utf8')) as {
      volumes: SeriesVolumeYaml[];
    };
    return series.volumes.map((volume) => ({
      params: { volume: volume.slug },
      content: chapterList(volume),
    }));
  },
};
