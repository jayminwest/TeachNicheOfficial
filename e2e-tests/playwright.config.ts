import { PlaywrightTestConfig, devices } from '@playwright/test';
import './setup/register-esm.js';
import os from 'os';
import path from 'path';

// Calculate optimal number of workers based on CPU cores
// Use 75% of available cores, minimum 2, maximum 8
const cpuCores = os.cpus().length;
const defaultWorkers = Math.max(2, Math.min(8, Math.floor(cpuCores * 0.75)));

const config: PlaywrightTestConfig = {
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  // More comprehensive exclusion of Jest test files and directories
  testIgnore: [
    '**/node_modules/**',
    '**/app/**/__tests__/**',
    '**/app/**/*.test.ts',
    '**/app/**/*.test.tsx',
    '**/app/**/*.integration.test.ts',
    '**/app/**/*.integration.test.tsx',
    '**/app/**/*.e2e.test.ts',
    '**/app/**/*.e2e.test.tsx',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/__mocks__/**',
    '**/jest.setup.js',
    '**/jest.config.js'
  ],
  timeout: 30000, // Reduced timeout for faster feedback
  retries: process.env.CI ? 2 : 0,
  // Set number of parallel workers
  workers: process.env.CI 
    ? parseInt(process.env.CI_WORKERS || '4') // Use environment variable in CI
    : parseInt(process.env.PLAYWRIGHT_WORKERS || String(defaultWorkers)), // Use calculated value locally
  // Configure web server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    cwd: '..',  // Run the command from the parent directory
    env: {
      // Ensure Next.js doesn't try to load Jest test files
      NODE_ENV: 'development',
      // Prevent ESM/CJS conflicts with lucide-react
      NEXT_IGNORE_TESTS: 'true',
      // Disable Jest auto-mocking
      DISABLE_JEST_AUTOMOCK: 'true',
      // Tell Next.js we're in E2E test mode
      NEXT_E2E_TEST: 'true',
      // Skip loading test files in Next.js
      NEXT_SKIP_TESTS: 'true'
    }
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  
  // Prevent Playwright from loading Jest test files
  forbidOnly: !!process.env.CI,
  // Ensure all tests run, including those that might be skipped
  grep: /.*/,
  projects: [
    // Setup project for Firebase emulators
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Regular browser testing projects
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    // Comment out additional browsers for faster local testing
    // Uncomment in CI environment
    /*
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
    {
      name: 'Mobile Chrome',
      use: devices['Pixel 5'],
    },
    */
    // Special project just for visual testing
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
    // Dedicated project for earnings dashboard tests
    {
      name: 'Earnings Dashboard Tests',
      use: { 
        browserName: 'chromium',
      },
      testMatch: /.*earnings-dashboard\.spec\.ts/
    }
  ],
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  // Update snapshots via command line: npx playwright test --update-snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS ? 'all' : 'missing',
  
  // Global setup to run before tests
  globalSetup: './setup/test-setup.ts',
  
  // Add setup for Firebase emulators and merge with existing projects
  // Note: We're modifying the projects array directly instead of redefining it
  
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
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
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 3,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60000, // 60 seconds to start the server
  },
});
