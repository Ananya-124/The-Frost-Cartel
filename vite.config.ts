import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['server/**', 'node'],
      ['database/**', 'node'],
      ['src/**', 'jsdom'],
    ],
    globals: true,
    setupFiles: './src/test/setup.ts',
    testTimeout: 15000,
    fileParallelism: false,
  },
})
