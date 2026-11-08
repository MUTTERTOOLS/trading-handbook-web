import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        'b1-map': fileURLToPath(new URL('./b1-map.html', import.meta.url)),
        'risk-math': fileURLToPath(new URL('./risk-math.html', import.meta.url)),
      },
    },
  },
});
