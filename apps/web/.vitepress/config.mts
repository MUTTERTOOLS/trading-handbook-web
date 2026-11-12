import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type HeadConfig, type DefaultTheme } from 'vitepress';
import YAML from 'yaml';
import { contentPlugin } from './plugins/content';

/**
 * 定位 content/：config 会被 VitePress 打包到 .vitepress/ 下的临时文件执行，
 * import.meta.url 会漂移，因此按候选目录 + series.yaml 存在性探测。
 */
function findContentDir(): string {
  const candidates = [
    fileURLToPath(new URL('../../../content', import.meta.url)),
    path.resolve(process.cwd(), '../../content'),
    path.resolve(process.cwd(), 'content'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'series.yaml'))) return dir;
  }
  throw new Error(`找不到 content 目录，尝试过：${candidates.join(' , ')}`);
}

const CONTENT_DIR = findContentDir();

/** 仓库根（CONTENT_DIR = <root>/content） */
const PROJECT_ROOT = path.dirname(CONTENT_DIR);
/**
 * 站点静态资源目录：成品图放 apps/web/public/figures，按契约 §5.2 以
 * /figures/<章id>-fig<n>.svg 访问。Vite 的 vite root 是 srcDir（content/），
 * 默认 public 目录会落到 content/public，因此这里显式指到 apps/web/public。
 */
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'apps', 'web', 'public');
const FIGURES_DIR = path.join(PUBLIC_DIR, 'figures');

interface SeriesVolumeYaml {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: string;
  expectedChapters: number;
}
interface SeriesYaml {
  title: string;
  version: number;
  cutoffDate: string;
  riskNotice: string;
  volumes: SeriesVolumeYaml[];
}

const series = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, 'series.yaml'), 'utf8')) as SeriesYaml;

/** 每册主题色（原 themes.css 的 html[data-volume] 值；按页注入 :root 覆盖） */
const ACCENTS: Record<string, { accent: string; rgb: string }> = {
  b1: { accent: '#60a5fa', rgb: '96, 165, 250' },
  b2: { accent: '#3cc5d8', rgb: '60, 197, 216' },
  b3: { accent: '#fb923c', rgb: '251, 146, 60' },
  b4: { accent: '#c084fc', rgb: '192, 132, 252' },
  b5: { accent: '#57c78a', rgb: '87, 199, 138' },
  b6: { accent: '#f472b6', rgb: '244, 114, 182' },
  b7: { accent: '#e8c268', rgb: '232, 194, 104' },
  b8: { accent: '#f87171', rgb: '248, 113, 113' },
};

function chapterIds(volume: SeriesVolumeYaml): string[] {
  return Array.from(
    { length: volume.expectedChapters },
    (_, index) => `${volume.id}-C${String(index + 1).padStart(2, '0')}`
  );
}

function chapterTitle(volume: SeriesVolumeYaml, chapterId: string): string {
  const source = fs.readFileSync(path.join(CONTENT_DIR, volume.id, `${chapterId}.md`), 'utf8');
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  return frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? chapterId;
}

/** 首页统计用：去 frontmatter、去 markdown 符号与空白的近似正文字数 */
function countPlainChars(): number {
  let total = 0;
  for (const volume of series.volumes) {
    for (const chapterId of chapterIds(volume)) {
      const body = fs
        .readFileSync(path.join(CONTENT_DIR, volume.id, `${chapterId}.md`), 'utf8')
        .replace(/^---\n[\s\S]*?\n---\n/, '');
      total += body.replace(/[#*`>|_=[\]()!~:-]|\s/g, '').length;
    }
  }
  return total;
}

const totals = {
  volumes: series.volumes.length,
  chapters: series.volumes.reduce((sum, volume) => sum + volume.expectedChapters, 0),
  chars: countPlainChars(),
};

/**
 * 本地搜索的 CJK 分词：minisearch 默认按空格/标点切词，中文整句会变成
 * 一个超长 token 导致检索失效。这里把连续汉字切成单字 + 相邻双字组（bigram），
 * 拉丁文按词保留；索引与查询两侧使用同一实现。
 */
function cjkTokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const match of text.matchAll(/[a-zA-Z0-9][a-zA-Z0-9'’-]*/g)) {
    tokens.push(match[0].toLowerCase());
  }
  for (const run of text.match(/[\u4e00-\u9fff]+/g) ?? []) {
    if (run.length === 1) {
      tokens.push(run);
      continue;
    }
    tokens.push(run.slice(0, 1));
    for (let i = 0; i < run.length - 1; i++) {
      tokens.push(run.slice(i, i + 2));
    }
  }
  return tokens;
}

// rewrites 键与目标值都以 .md 结尾：键匹配 srcDir 下真实文件，
// 目标值作为 SSR 模块 id（保持 .md），最终产物由 VP 派生为 .html。
// 契约目标路由：/b{册}/c{两位章号}
const rewrites: Record<string, string> = {};
for (const volume of series.volumes) {
  for (const [index, chapterId] of chapterIds(volume).entries()) {
    const chapterNo = String(index + 1).padStart(2, '0');
    rewrites[`${volume.id}/${chapterId}.md`] = `${volume.slug}/c${chapterNo}.md`;
  }
}

const sidebar: Record<string, DefaultTheme.SidebarItem[]> = Object.fromEntries(
  series.volumes.map((volume) => [
    `/${volume.slug}/`,
    [
      {
        text: `${volume.id} ${volume.title}`,
        items: chapterIds(volume).map((chapterId, index) => ({
          text: `§${index + 1} ${chapterTitle(volume, chapterId)}`,
          link: `/${volume.slug}/c${String(index + 1).padStart(2, '0')}.html`,
        })),
      },
    ],
  ])
);

export default defineConfig({
  lang: 'zh-CN',
  title: '新手交易系统化入门丛书',
  description: '8 册 77 章新手交易系统化入门丛书的交互阅读版：书稿为唯一内容源，网页直接渲染 Markdown。',
  appearance: 'dark',
  srcDir: CONTENT_DIR,
  srcExclude: ['editorial/**', '**/*_delivery.md', 'dist/**'],
  rewrites,
  // 契约 §6.1：md 源零 HTML。正文词汇全部经插件转成呈现标记，
  // 开发者误写标签时 html:false 会原样输出文本，便于构建期发现。
  markdown: {
    html: false,
    config(md) {
      md.use(contentPlugin, { figuresDir: FIGURES_DIR });
    },
  },
  // 成品图静态目录（VitePress 1.6.4 无顶层 publicDir 选项，经 vite.publicDir 覆盖）
  vite: {
    publicDir: PUBLIC_DIR,
  },
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap',
      },
    ],
    ['meta', { name: 'theme-color', content: '#0B0E14' }],
  ],
  themeConfig: {
    siteTitle: '新手交易系统化入门丛书',
    nav: [
      { text: '丛书总览', link: '/' },
      {
        text: '分册',
        items: series.volumes.map((volume) => ({
          text: `${volume.id} ${volume.title}`,
          link: `/${volume.slug}.html`,
        })),
      },
    ],
    sidebar,
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: { tokenize: cjkTokenize },
          searchOptions: { tokenize: cjkTokenize, fuzziness: 0 },
        },
        translations: {
          button: { buttonText: '搜索手册', buttonAriaLabel: '搜索手册' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清空关键词',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一章', next: '下一章' },
    // series 为自定义键（SeriesHome / VolumeIntro 读取），默认主题类型未声明
    series: {
      title: series.title,
      riskNotice: series.riskNotice,
      cutoffDate: series.cutoffDate,
      totals,
      volumes: series.volumes,
    },
  } as DefaultTheme.Config,
  transformPageData(pageData) {
    // rewrite 后 relativePath 是小写目标路径（b1/c01.md），用不区分大小写匹配
    const relativePath = pageData.relativePath ?? '';
    const volumeMatch = relativePath.match(/^\/?b([1-8])\//i);
    const params = pageData.params as { volume?: string } | undefined;

    // 分册动态页（[volume].md 的实例）：按 params 设置标题与主题
    if (params?.volume) {
      const volume = series.volumes.find((item) => item.slug === params.volume);
      if (volume) {
        const title = `${volume.id} ${volume.title}`;
        pageData.frontmatter.title = title;
        // renderPage 的 <title> 读取的是 transform 之前就已生成的 pageData.title
        (pageData as { title?: string }).title = title;
      }
    }

    const themeKey = volumeMatch ? `b${volumeMatch[1]}` : params?.volume;
    const accent = themeKey ? ACCENTS[themeKey] : undefined;
    if (!accent) return;
    const head = (pageData.frontmatter.head ??= []) as HeadConfig[];
    if (head.some((entry) => (entry[1] as Record<string, string> | undefined)?.['data-accent'] === themeKey)) {
      return;
    }
    head.push([
      'style',
      { 'data-accent': themeKey! },
      // 与 custom.css 的 :root.dark 同特异性，且页面内 style 晚于样式表加载，可稳定覆盖
      `:root{--accent:${accent.accent};--accent-dim:rgba(${accent.rgb},0.14);--accent-glow:rgba(${accent.rgb},0.28);--border-accent:rgba(${accent.rgb},0.32);}` +
        `:root.dark{--accent:${accent.accent};--accent-dim:rgba(${accent.rgb},0.14);--accent-glow:rgba(${accent.rgb},0.28);--border-accent:rgba(${accent.rgb},0.32);}`,
    ]);
  },
  buildEnd({ outDir }) {
    // 旧地址跳转页（b1..b8 现在就是真实的分册落地页，无需跳转）
    const redirects: Record<string, string> = {
      'b1-map.html': '/b1.html',
      'risk-math.html': '/b3.html',
    };
    for (const [file, target] of Object.entries(redirects)) {
      fs.writeFileSync(
        path.join(outDir, file),
        `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}">` +
          `<title>页面已迁移</title><a href="${target}">旧地址已迁移，点击进入 ${target}</a>`,
        'utf8'
      );
    }
  },
});
