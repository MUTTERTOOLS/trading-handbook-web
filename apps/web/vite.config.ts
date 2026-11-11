import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const volumeSlugs = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fromRoot('./src'),
      '@content': fromRoot('../../content/dist'),
    },
  },
  server: {
    fs: {
      // 内容数据在 apps/web 之外，开发服务器需要显式放行工作区根目录
      allow: [fromRoot('../..')],
    },
  },
  build: {
    // 单册 AST JSON 本身就有数百 kB，已按册拆分为独立 chunk；
    // 这里只放宽提示阈值，避免正常内容体积淹没真正的分包问题。
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        index: fromRoot('./index.html'),
        ...Object.fromEntries(
          volumeSlugs.map((slug) => [slug, fromRoot(`./${slug}.html`)])
        ),
        // 旧地址保留为静态跳转页，避免旧链接失效
        'b1-map': fromRoot('./b1-map.html'),
        'risk-math': fromRoot('./risk-math.html'),
      },
    },
  },
});
