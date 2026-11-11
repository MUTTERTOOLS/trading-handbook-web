import seriesJson from '@content/series.json';
import editionJson from '@content/edition.json';
import type {
  Edition,
  SeriesData,
  VolumeContent,
  VolumeId,
} from '@trading-handbook/content-model';

export const series = seriesJson as unknown as SeriesData;
export const edition = editionJson as unknown as Edition;

/** JSON 导入会把字面量类型放宽为 string，这里统一收敛为 VolumeContent */
function volumeModule(
  loader: () => Promise<unknown>
): () => Promise<{ default: VolumeContent }> {
  return loader as () => Promise<{ default: VolumeContent }>;
}

/**
 * 显式列出 8 个分册，避免 import.meta.glob 在 content/dist 被重新生成时
 * 命中不完整；同时让每个分册保持独立 chunk。
 */
const volumeLoaders: Record<VolumeId, () => Promise<{ default: VolumeContent }>> = {
  B1: volumeModule(() => import('@content/volumes/B1.json')),
  B2: volumeModule(() => import('@content/volumes/B2.json')),
  B3: volumeModule(() => import('@content/volumes/B3.json')),
  B4: volumeModule(() => import('@content/volumes/B4.json')),
  B5: volumeModule(() => import('@content/volumes/B5.json')),
  B6: volumeModule(() => import('@content/volumes/B6.json')),
  B7: volumeModule(() => import('@content/volumes/B7.json')),
  B8: volumeModule(() => import('@content/volumes/B8.json')),
};

export async function loadVolume(id: VolumeId): Promise<VolumeContent> {
  const loader = volumeLoaders[id];
  if (!loader) {
    throw new Error(`找不到分册数据：${id}`);
  }
  const module = await loader();
  return module.default;
}
