import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets make the production build portable to GitHub Pages.
  base: './',
  build: { outDir: 'docs', emptyOutDir: true }
});
