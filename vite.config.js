import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so `dist/` works from any folder or sub-path on any static host.
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
});
