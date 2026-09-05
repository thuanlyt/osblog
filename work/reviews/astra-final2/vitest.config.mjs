import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Run existing local runtime tests with all review caches confined to this scope.
export default defineConfig({
  envDir: false,
  cacheDir: 'work/reviews/astra-final2/.vite',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/server/**/*.test.ts'],
    exclude: [],
    setupFiles: [],
    fileParallelism: false,
    cache: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
})
