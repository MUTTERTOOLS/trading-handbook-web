import { z } from 'zod';

export const VOLUME_IDS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'] as const;
export const VolumeIdSchema = z.enum(VOLUME_IDS);
export type VolumeId = z.infer<typeof VolumeIdSchema>;

export const SeriesVolumeSchema = z.object({
  id: VolumeIdSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  theme: z.string().min(1),
  expectedChapters: z.number().int().positive(),
});
export type SeriesVolume = z.infer<typeof SeriesVolumeSchema>;

export const SeriesSchema = z.object({
  title: z.string().min(1),
  version: z.number().int().positive(),
  cutoffDate: z.string().min(1),
  riskNotice: z.string().min(1),
  volumes: z.array(SeriesVolumeSchema).length(8),
});
export type Series = z.infer<typeof SeriesSchema>;

export const ChapterFrontmatterSchema = z.object({
  chapter_id: z.string().regex(/^B[1-8]-C\d{2}$/),
  title: z.string().min(1),
  prerequisites: z.array(z.string()).default([]),
  new_terms: z.array(z.string()).max(8).default([]),
  formulas: z.array(z.string()).default([]),
  constants_used: z.array(z.string()).default([]),
  status: z.enum(['draft', 'review', 'final']).default('final'),
});
export type ChapterFrontmatter = z.infer<typeof ChapterFrontmatterSchema>;

export interface BlockBase {
  /** 纯文本，供搜索与 edition 锚点定位使用 */
  text?: string;
}

export type CalloutVariant = 'key' | 'tip' | 'warn' | 'danger';

export type Block = BlockBase &
  (
    | { type: 'heading'; depth: 3 | 4; id: string; html: string }
    | { type: 'paragraph'; html: string }
    | { type: 'list'; ordered: boolean; html: string }
    | { type: 'table'; html: string }
    | { type: 'blockquote'; html: string }
    | { type: 'code'; html: string }
    | { type: 'html'; html: string }
    | { type: 'hr' }
    | { type: 'callout'; variant: CalloutVariant; title: string; blocks: Block[] }
    | { type: 'opening'; blocks: Block[] }
    | { type: 'goals'; items: string[] }
    | { type: 'quiz'; questionHtml: string; answerBlocks: Block[]; answerLabel?: boolean }
    | { type: 'summary'; items: string[] }
    | { type: 'cheat'; html: string }
    | { type: 'links'; items: string[] }
    | { type: 'risk'; html: string }
    | { type: 'figure'; id: string; specHtml: string }
    | { type: 'widget'; id: string; params?: Record<string, unknown> }
    | { type: 'section'; id: string; title: string; blocks: Block[] }
  );

export interface TocItem {
  id: string;
  label: string;
  depth: 2 | 3;
}

export interface ChapterStats {
  chars: number;
  figures: number;
  verify: number;
  quizzes: number;
  misconceptions: number;
}

export interface Chapter {
  id: string;
  volumeId: VolumeId;
  slug: string;
  title: string;
  meta: ChapterFrontmatter;
  blocks: Block[];
  toc: TocItem[];
  stats: ChapterStats;
}

export interface ChapterSummary {
  id: string;
  slug: string;
  title: string;
  status: ChapterFrontmatter['status'];
  chars: number;
  figures: number;
  verify: number;
  constants: string[];
}

export interface VolumeSummary extends SeriesVolume {
  chapters: ChapterSummary[];
}

export interface SeriesTotals {
  volumes: number;
  chapters: number;
  chars: number;
  figures: number;
  verify: number;
}

export interface SeriesData {
  title: string;
  version: number;
  cutoffDate: string;
  riskNotice: string;
  generatedAt: string;
  totals: SeriesTotals;
  volumes: VolumeSummary[];
}

export interface VolumeStats {
  chapters: number;
  chars: number;
  figures: number;
  verify: number;
  quizzes: number;
  misconceptions: number;
}

export interface VolumeContent {
  volume: SeriesVolume;
  chapters: Chapter[];
  stats: VolumeStats;
}
