/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom'
          ]
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    teardownTimeout: 1000,
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ['default'],
    logHeapUsage: true,
    isolate: false,
    forceRerunTriggers: ['**/vite.config.*', '**/vitest.config.*'],
  },
})
