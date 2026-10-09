import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/order-me-app/`,
    locale: 'en-GB',
    // Keep what a failure looked like: a trace on the retry, a screenshot when it finally fails.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-phone', use: { ...devices['Pixel 7'] } },
    // iPhone/Safari is a first-class target (install guide, storage separation, wake lock): test it too.
    { name: 'webkit-phone', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    // CI has built already (for the size budget): build once, not twice.
    command: process.env.CI
      ? `npm run preview -- --port ${PORT} --strictPort`
      : `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/order-me-app/`,
    reuseExistingServer: !process.env.CI,
  },
})
