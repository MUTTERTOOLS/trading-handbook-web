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

/**
 * 分册页正文章目录（D12 起）：编号章目录改由 VolumeIntro 组件渲染
 * （数据来自 config.mts themeConfig.series.volumes[].chapters，同一
 * frontmatter title 数据源），本生成器只负责展开动态路由参数，
 * `<!-- @content -->` 占位以空内容替换。
 */
export default {
  watch: ['series.yaml', 'B*/B*.md'],
  paths() {
    const series = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, 'series.yaml'), 'utf8')) as {
      volumes: SeriesVolumeYaml[];
    };
    return series.volumes.map((volume) => ({
      params: { volume: volume.slug },
      // 单空格：空字符串是 falsy，VitePress 会跳过 `<!-- @content -->` 占位替换
      // 并把注释原文当正文文本输出（html:false 下可见）
      content: ' ',
    }));
  },
};
