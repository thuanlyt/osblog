import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: '.', testMatch: '**/*.spec.ts', fullyParallel: false, workers: 1,
  timeout: 45_000, expect: { timeout: 10_000 },
  outputDir: '../../test-results/browser', reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5180', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'on', launchOptions: { executablePath: process.env.OSBLOG_TEST_BROWSER || undefined } },
  webServer: { command: 'npx tsx tests/browser/server.ts', cwd: '../..', url: 'http://127.0.0.1:5180/api/healthz', reuseExistingServer: false, timeout: 45_000 },
})
