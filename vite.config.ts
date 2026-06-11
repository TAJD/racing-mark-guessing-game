/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    // Scoped so stray git worktree directories inside the repo root
    // (bd worktree create) don't get their tests collected
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: [resolve(__dirname, "src/test/setup.ts")],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    teardownTimeout: 1000,
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ["default"],
    logHeapUsage: true,
    isolate: false,
    forceRerunTriggers: ["**/vite.config.*", "**/vitest.config.*"],
  },
});
