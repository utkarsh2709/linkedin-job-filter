import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Content scripts can't be ES modules, so bundle into one self-contained IIFE.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/content/index.ts'),
      formats: ['iife'],
      name: 'LinkedInCompanyFilter',
      fileName: () => 'content.js',
    },
  },
});
