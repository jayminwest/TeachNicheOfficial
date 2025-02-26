import { PlaywrightTestConfig, devices } from '@playwright/test';
import './setup/register-esm.js';
import os from 'os';
import path from 'path';

// Calculate optimal number of workers based on CPU cores
// Use 75% of available cores, minimum 2, maximum 8
const cpuCores = os.cpus().length;
const defaultWorkers = Math.max(2, Math.min(8, Math.floor(cpuCores * 0.75)));

const config: PlaywrightTestConfig = {
  testDir: './',
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
    '**/__mocks__/**'
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
      NEXT_E2E_TEST: 'true'
    }
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
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
  
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
};

export default config;
