import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Independent UA-0048 audit: no environment files, provider connections or shared build writes.
export default defineConfig({
  envDir: false,
  cacheDir: 'work/reviews/astra/.vite',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/server/**/*.test.ts', 'work/reviews/astra/*.review.ts'],
    exclude: [],
    setupFiles: [],
    fileParallelism: false,
    cache: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    reporters: ['verbose', 'json'],
    outputFile: { json: 'work/reviews/astra/results.json' },
  },
})
