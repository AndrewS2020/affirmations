import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/affirmations/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/affirmations/api': {
        target: 'http://localhost:3777',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/affirmations/, '')
      },
      '/api': {
        target: 'http://localhost:3777',
        changeOrigin: true,
      }
    }
  }
});
