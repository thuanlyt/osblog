import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Review-owned runner: no environment files or writes to shared test/build caches.
export default defineConfig({
  envDir: false,
  cacheDir: 'work/reviews/astra-rereview/.vite',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/server/**/*.test.ts', 'work/reviews/astra-rereview/*.review.ts'],
    exclude: [],
    setupFiles: [],
    fileParallelism: false,
    cache: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    reporters: ['verbose', 'json'],
    outputFile: { json: 'work/reviews/astra-rereview/results.json' },
  },
})
