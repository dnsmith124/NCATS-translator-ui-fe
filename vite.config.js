import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      chunkSizeWarningLimit: 1600,
      sourcemap: true
    },
    plugins: [
      react(),
      eslint(),
      // svgr options: https://react-svgr.com/docs/options/
      svgr(),
    ],
  };
});