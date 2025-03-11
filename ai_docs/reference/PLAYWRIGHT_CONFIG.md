# Playwright Configuration Reference

This document provides a reference for the Playwright configuration used in the Teach Niche platform.

## Configuration File

Our Playwright configuration is defined in `playwright.config.ts` at the root of the project:

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Teach Niche E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  
  // Global setup to run before all tests
  globalSetup: './e2e-tests/global-setup.ts',
  
  // Shared settings for all projects
  use: {
    // Base URL to use in navigation
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying a failed test
    trace: 'on-first-retry',
    
    // Take screenshots on failure
    screenshot: 'only-on-failure',
    
    // Record video on first retry
    video: 'on-first-retry',
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Automatically wait for actionability
    actionTimeout: 10000,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
  },
  
  // Configure projects for different browsers
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
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'authenticated',
      testMatch: /.*\.auth\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],
  
  // Web server to start before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Key Configuration Options

### Test Directory

```typescript
testDir: './e2e-tests'
```

Specifies the directory where Playwright will look for test files.

### Parallelization

```typescript
fullyParallel: true
```

Enables running tests in parallel for faster execution.

### Retries

```typescript
retries: process.env.CI ? 2 : 0
```

Configures test retries - 2 retries in CI environments, 0 in development.

### Workers

```typescript
workers: process.env.CI ? 1 : undefined
```

Controls the number of parallel worker processes. In CI, we use 1 worker to avoid resource contention.

### Reporters

```typescript
reporter: [
  ['html'],
  ['json', { outputFile: 'test-results/test-results.json' }]
]
```

Configures test reporters:
- HTML reporter for visual inspection of test results
- JSON reporter for programmatic access to test results

### Global Setup

```typescript
globalSetup: './e2e-tests/global-setup.ts'
```

Points to a file that runs once before all tests, used for environment setup.

### Base Settings

```typescript
use: {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'on-first-retry',
  viewport: { width: 1280, height: 720 },
  actionTimeout: 10000,
  ignoreHTTPSErrors: true,
}
```

Defines default settings for all test projects:
- `baseURL`: The base URL for navigation
- `trace`: When to record traces (on first retry)
- `screenshot`: When to take screenshots (only on failure)
- `video`: When to record videos (on first retry)
- `viewport`: Default viewport size
- `actionTimeout`: Maximum time to wait for actions
- `ignoreHTTPSErrors`: Whether to ignore HTTPS errors

### Browser Projects

```typescript
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
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'mobile-safari',
    use: { ...devices['iPhone 12'] },
  }
]
```

Configures different browser environments for testing:
- Desktop browsers: Chrome, Firefox, Safari
- Mobile browsers: Chrome on Pixel 5, Safari on iPhone 12

### Authentication Projects

```typescript
projects: [
  // ... other projects
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: 'authenticated',
    testMatch: /.*\.auth\.spec\.ts/,
    dependencies: ['setup'],
    use: {
      storageState: 'playwright/.auth/user.json',
    },
  },
]
```

Special projects for authentication:
- `setup`: Runs authentication setup scripts
- `authenticated`: Runs tests that require authentication, using stored auth state

### Web Server

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
}
```

Configures a development server to start before running tests:
- `command`: Command to start the server
- `url`: URL to wait for before starting tests
- `reuseExistingServer`: Whether to reuse an existing server (yes in development, no in CI)
- `timeout`: Maximum time to wait for the server to start

## Global Setup File

The global setup file (`e2e-tests/global-setup.ts`) is used for environment initialization:

```typescript
import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

async function globalSetup(config: FullConfig) {
  // Load environment variables
  dotenv.config({ path: '.env.test' });
  
  // Set up test database if needed
  if (process.env.SETUP_TEST_DB === 'true') {
    await setupTestDatabase();
  }
  
  // Other global setup tasks
  console.log('Global setup complete');
}

async function setupTestDatabase() {
  // Database setup logic
  console.log('Test database initialized');
}

export default globalSetup;
```

## Authentication Setup File

The authentication setup file (`e2e-tests/auth.setup.ts`) handles authentication state:

```typescript
import { test as setup } from '@playwright/test';
import { LoginPage } from './models/LoginPage';

setup('authenticate as user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  
  // Save storage state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

setup('authenticate as instructor', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('instructor@example.com', 'password123');
  
  // Save storage state
  await page.context().storageState({ path: 'playwright/.auth/instructor.json' });
});
```

## Running Specific Configurations

### Running Tests in a Specific Browser

```bash
# Run tests in Chrome only
npx playwright test --project=chromium

# Run tests in Firefox only
npx playwright test --project=firefox

# Run tests in Safari only
npx playwright test --project=webkit
```

### Running Tests on Mobile Browsers

```bash
# Run tests on mobile Chrome
npx playwright test --project=mobile-chrome

# Run tests on mobile Safari
npx playwright test --project=mobile-safari
```

### Running Authenticated Tests

```bash
# Run tests that require authentication
npx playwright test --project=authenticated
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_BASE_URL` | Base URL for tests | `http://localhost:3000` |
| `CI` | Whether running in CI environment | - |
| `SETUP_TEST_DB` | Whether to set up test database | `false` |
| `DEBUG` | Enable debug logging | - |
| `PWDEBUG` | Enable Playwright Inspector | - |

## Customizing Configuration

### For Local Development

Create a `playwright.local.config.ts` file:

```typescript
import baseConfig from './playwright.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...baseConfig,
  // Override settings for local development
  workers: 1,
  retries: 0,
  use: {
    ...baseConfig.use,
    headless: false,
    trace: 'on',
    video: 'on',
  },
});
```

Run with:

```bash
npx playwright test --config=playwright.local.config.ts
```

### For CI Environment

Our CI configuration is handled through environment variables in the GitHub Actions workflow.

## Extending Configuration

To add new browser configurations or test projects, modify the `projects` array in `playwright.config.ts`.

Example of adding a new project for tablet testing:

```typescript
projects: [
  // ... existing projects
  {
    name: 'tablet',
    use: { ...devices['iPad Pro 11'] },
  },
]
```

## Best Practices

1. **Keep the configuration DRY**: Use the base configuration and extend it for specific needs
2. **Use environment variables**: For environment-specific settings
3. **Optimize for CI**: Configure retries and parallelization appropriately
4. **Manage resources**: Limit workers in resource-constrained environments
5. **Use device presets**: Leverage Playwright's device presets for consistent testing

## Troubleshooting

### Tests are slow in CI

- Reduce the number of browser projects
- Run only critical tests in CI
- Optimize the `webServer` configuration

### Authentication issues

- Check the `auth.setup.ts` file
- Verify the storage state path
- Ensure dependencies are correctly configured

### Flaky tests

- Increase retry count
- Enable trace recording
- Review timeouts and waiting strategies

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-25 | QA Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
