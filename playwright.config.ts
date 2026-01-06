import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for liquidVex E2E tests
 * 
 * Resource-optimized for autonomous coding system:
 * - Single browser (chromium) in development to reduce CPU/memory
 * - Multi-browser testing enabled only in CI via PLAYWRIGHT_MULTI_BROWSER=1
 * - Resource-limiting browser args to prevent runaway processes
 * - Sequential execution (workers: 1) for consistency
 */

// Resource-limiting browser launch arguments
const resourceLimitingArgs = [
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-software-rasterizer',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--no-first-run',
  '--safebrowsing-disable-auto-update',
  '--single-process', // Reduces child process count significantly
];

// Use multi-browser only when explicitly enabled (CI) or env var set
const useMultiBrowser = process.env.CI || process.env.PLAYWRIGHT_MULTI_BROWSER === '1';

// Build projects array based on mode
const projects = useMultiBrowser
  ? [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          launchOptions: { args: resourceLimitingArgs },
        },
      },
      {
        name: 'firefox',
        use: {
          ...devices['Desktop Firefox'],
          launchOptions: {
            firefoxUserPrefs: {
              // Disable Firefox telemetry and background services
              'toolkit.telemetry.enabled': false,
              'datareporting.policy.dataSubmissionEnabled': false,
              'browser.shell.checkDefaultBrowser': false,
              'browser.cache.disk.enable': false,
              'browser.cache.memory.enable': true,
              'browser.cache.memory.capacity': 32768, // 32MB max
            },
          },
        },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ]
  : [
      // Development mode: Single browser only (reduces CPU by ~66%)
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          launchOptions: { args: resourceLimitingArgs },
        },
      },
    ];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Better test isolation, reduces concurrent browsers
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Sequential execution - critical for resource management
  reporter: 'html',

  // Global timeout to prevent hanging tests from consuming resources
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for expect assertions
  },

  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Headless mode with optimized viewport
    headless: true,
    viewport: { width: 1280, height: 720 },

    // Reduce video recording overhead
    video: 'off',
  },

  projects,

  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : {
        command: 'cd apps/web && pnpm dev --port 3002',
        url: 'http://localhost:3002',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },

  // Global teardown to ensure browser cleanup
  globalTeardown: undefined, // Can be set to a cleanup script if needed
});
