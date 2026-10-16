import { defineConfig } from 'vite';

export default defineConfig({
  base: '/mu-law-portal/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  publicDir: 'public',
});
