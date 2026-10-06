import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Builds the popup (React) and copies manifest.json + public/ into dist/.
// The content script is built separately as an IIFE: see vite.content.config.ts.
export default defineConfig({
  root: 'src',
  publicDir: resolve(import.meta.dirname, 'public'),
  plugins: [react()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: { popup: resolve(import.meta.dirname, 'src/popup/index.html') },
    },
  },
  test: {
    root: import.meta.dirname,
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
