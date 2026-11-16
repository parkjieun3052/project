import { defineConfig } from 'vite';

export default defineConfig({
  root: 'front-end',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        search: 'search.html',
      },
    },
  },
});
