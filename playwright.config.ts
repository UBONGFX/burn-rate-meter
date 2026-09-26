import { defineConfig, devices } from '@playwright/test'
import { DEV_PORT as PORT, PAGES_APP, PAGES_PORT } from './e2e/servers.ts'


export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The app auto-detects its language from the browser, so pin it for stable text.
    locale: 'de-DE',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build -- --outDir dist-pages && npx vite preview --outDir dist-pages --port ${PAGES_PORT} --strictPort`,
      env: { BASE_PATH: '/burn-rate-meter/' },
      url: PAGES_APP,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
