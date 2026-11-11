import { createApp } from 'vue';
import type { VolumeId } from '@trading-handbook/content-model';
import VolumePage from '@/content/VolumePage.vue';
import { loadVolume, series } from '@/content';
import '@/shared/styles/tokens.css';
import '@/shared/styles/base.css';
import '@/shared/styles/layout.css';
import '@/shared/styles/components.css';
import '@/shared/styles/themes.css';
import '@/content/content.css';

const volumeId = (document.documentElement.dataset.volume ?? 'B1').toUpperCase() as VolumeId;
const CN_NUM: Record<string, string> = {
  B1: '一',
  B2: '二',
  B3: '三',
  B4: '四',
  B5: '五',
  B6: '六',
  B7: '七',
  B8: '八',
};

loadVolume(volumeId)
  .then((volume) => {
    document.title = `${volume.volume.title} · 册${CN_NUM[volume.volume.id] ?? ''}主题页`;
    createApp(VolumePage, { volume, series }).mount('#app');
  })
  .catch((error: unknown) => {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<p style="padding:40px;color:#f87171;">分册数据加载失败：${
        error instanceof Error ? error.message : String(error)
      }</p>`;
    }
    console.error(error);
  });
