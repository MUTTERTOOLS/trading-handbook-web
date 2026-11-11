import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  EditionSchema,
  type Chapter,
  type Edition,
} from '@trading-handbook/content-model';

/** 网页端已注册的交互组件；新增组件时同步改这里与 apps/web/src/widgets/index.ts */
export const WIDGET_IDS = [
  'ThreeQuestions',
  'ExpectancyExplorer',
  'RecoverCurve',
  'PositionCalculator',
  'GapConstraint',
  'DrawdownStreak',
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

const WIDGET_ID_SET = new Set<string>(WIDGET_IDS);

export interface EditionIssue {
  chapterId: string;
  widgetId: string;
  message: string;
}

export function editionFile(root: string): string {
  return path.join(root, 'content', 'edition.yaml');
}

export function readEdition(root: string): Edition {
  const file = editionFile(root);
  if (!fs.existsSync(file)) return {};
  const raw = YAML.parse(fs.readFileSync(file, 'utf8')) ?? {};
  return EditionSchema.parse(raw);
}

export function validateEdition(edition: Edition, chapters: Chapter[]): EditionIssue[] {
  const issues: EditionIssue[] = [];
  const chapterMap = new Map(chapters.map((chapter) => [chapter.id, chapter]));

  for (const [chapterId, placements] of Object.entries(edition)) {
    const chapter = chapterMap.get(chapterId);
    if (!chapter) {
      issues.push({
        chapterId,
        widgetId: '-',
        message: 'edition.yaml 引用了不存在的章节',
      });
      continue;
    }
    for (const placement of placements) {
      if (!WIDGET_ID_SET.has(placement.id)) {
        issues.push({
          chapterId,
          widgetId: placement.id,
          message: '组件未在 tools/content/edition.ts 中注册',
        });
        continue;
      }
      const found = chapter.blocks.some((block) =>
        (block.text ?? '').includes(placement.afterText)
      );
      if (!found) {
        issues.push({
          chapterId,
          widgetId: placement.id,
          message: `锚点未命中：${placement.afterText}`,
        });
      }
    }
  }

  return issues;
}

export function loadEdition(root: string, chapters: Chapter[]): Edition {
  const edition = readEdition(root);
  const issues = validateEdition(edition, chapters);
  if (issues.length) {
    throw new Error(
      issues
        .map(
          (issue) =>
            `edition.yaml：${issue.chapterId} → ${issue.widgetId}：${issue.message}`
        )
        .join('\n')
    );
  }
  return edition;
}
