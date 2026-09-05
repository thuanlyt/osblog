import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Review runner: isolated caches and no environment-file loading.
export default defineConfig({
  envDir: false,
  cacheDir: 'work/reviews/astra-final/.vite',
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
  },
})
