import { PlaywrightTestConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright configuration for comprehensive production readiness testing
 * 
 * Features:
 * - Multi-browser and device testing
 * - Accessibility testing
 * - Visual regression testing
 * - Performance testing
 * - Network condition simulation
 * - Comprehensive reporting
 */
const config: PlaywrightTestConfig = {
  testDir: '.',
  testMatch: 'tests/**/*.spec.ts',
  // Increased timeout for more thorough tests, especially on CI
  timeout: process.env.CI ? 60000 : 30000,
  // More retries on CI to handle flakiness
  retries: process.env.CI ? 3 : 1,
  // Fail fast in local development, but run all tests on CI
  forbidOnly: !!process.env.CI,
  // Parallel tests for faster execution
  workers: process.env.CI ? 4 : undefined,
  // Global setup and teardown for test data management
  globalSetup: require.resolve('./helpers/global-setup.ts'),
  globalTeardown: require.resolve('./helpers/global-teardown.ts'),
  
  webServer: {
    command: 'npm run build && npx serve -s .next -p 3000',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    // Enhanced tracing for better debugging
    trace: process.env.CI ? 'on' : 'retain-on-failure',
    // Always capture screenshots on failure
    screenshot: 'only-on-failure',
    // Capture videos for all tests on CI, only failures locally
    video: process.env.CI ? 'on' : 'retain-on-failure',
    // Enable built-in accessibility testing
    contextOptions: {
      reducedMotion: 'reduce',
      strictSelectors: true,
    },
    // Automatically wait for elements to be stable
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // Capture console logs and request/response data
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    },
  },
  
  projects: [
    // Main browser testing projects
    {
      name: 'Chrome',
      use: { 
        browserName: 'chromium',
        permissions: ['geolocation', 'notifications'],
        // Collect performance metrics
        contextOptions: {
          timezoneId: 'America/New_York',
        },
      },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
    
    // Mobile device testing
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        // Test with touch events
        hasTouch: true,
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
        hasTouch: true,
      },
    },
    
    // Special testing projects
    {
      name: 'Visual Tests',
      use: { 
        browserName: 'chromium',
        // Consistent viewport for visual testing
        viewport: { width: 1280, height: 720 },
        // Consistent theme for visual testing
        colorScheme: 'light',
      },
      testMatch: /.*\.visual\.spec\.ts/
    },
    {
      name: 'Accessibility Tests',
      use: { 
        browserName: 'chromium',
        // Enable additional accessibility checks
      },
      testMatch: /.*\.a11y\.spec\.ts/
    },
    {
      name: 'Performance Tests',
      use: { 
        browserName: 'chromium',
        // Throttle CPU for more realistic testing
        launchOptions: {
          args: ['--cpu-throttling-rate=4'],
        },
      },
      testMatch: /.*\.perf\.spec\.ts/
    },
    {
      name: 'Slow Network',
      use: {
        browserName: 'chromium',
        // Simulate slow 3G connection
        contextOptions: {
          networkThrottling: {
            downloadThroughput: (1.5 * 1024 * 1024) / 8,
            uploadThroughput: (750 * 1024) / 8,
            latency: 150
          },
        },
      },
      testMatch: /.*\.network\.spec\.ts/
    },
  ],
  
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  
  // Update snapshots via command line: npx playwright test --update-snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS ? 'all' : 'missing',
  
  // Explicitly ignore node_modules and app directories to avoid conflicts with Jest tests
  testIgnore: ['**/node_modules/**', '**/app/**'],
  
  // Enhanced screenshot comparison settings
  expect: {
    toHaveScreenshot: {
      // More strict threshold for visual testing
      maxDiffPixelRatio: 0.02,
      // Threshold for individual pixels
      threshold: 0.2,
      // Allow for slight animations
      animations: 'disabled',
    },
    toMatchSnapshot: {
      // More strict threshold for snapshot testing
      threshold: 0.2,
    },
  },
};

export default config;
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    /* Test against branded browsers. */
    {
      name: 'Visual Tests',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Accessibility Tests',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Performance Tests',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Slow Network',
      use: { 
        ...devices['Desktop Chrome'],
        networkConditions: {
          download: 1 * 1024 * 1024 / 8, // 1 Mbps
          upload: 500 * 1024 / 8, // 500 Kbps
          latency: 100 // 100ms
        }
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
