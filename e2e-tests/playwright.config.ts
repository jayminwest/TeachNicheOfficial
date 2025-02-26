import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30000, // Reduced timeout for faster feedback
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
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
  // Explicitly ignore node_modules and app directories to avoid conflicts with Jest tests
  testIgnore: ['**/node_modules/**', '**/app/**'],
  
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
};

export default config;
