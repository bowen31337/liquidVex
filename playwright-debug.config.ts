import { defineConfig, devices } from '@playwright/test';

/**
 * Debug Playwright configuration for wallet modal debugging
 */
export default defineConfig({
  testDir: './',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    headless: true,  // Run headless for server environment
  },

  projects: [
    {
      name: 'debug',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start web server since it's already running
  webServer: undefined,
});