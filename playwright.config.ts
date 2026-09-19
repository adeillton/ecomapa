import { defineConfig, devices } from '@playwright/test'
const dev = process.env.PLAYWRIGHT_SERVER === 'dev'
const port = dev ? 4174 : 4173
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: `npm run ${dev ? 'dev' : 'preview'} -- --host 127.0.0.1 --port ${port} --strictPort`, url: `http://127.0.0.1:${port}`, reuseExistingServer: false },
})
