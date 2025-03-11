# Test Automation

This document outlines the test automation approach for the Teach Niche platform, with a focus on Playwright for end-to-end testing.

## Automation Tools

### End-to-End Testing with Playwright

Playwright is our primary tool for end-to-end testing, chosen for its:

- **Cross-browser support**: Tests run on Chromium, Firefox, and WebKit
- **Reliable automation**: Auto-wait capabilities reduce flakiness
- **Modern architecture**: Works with modern web features and frameworks
- **Performance**: Parallel test execution and isolation
- **Developer experience**: Debugging tools and trace viewer

### Other Automation Tools

- **Unit Testing**: Jest with React Testing Library
- **API Testing**: Supertest with Jest
- **Visual Testing**: Playwright's screenshot comparison
- **Performance Testing**: Lighthouse CI

## Playwright Setup

### Installation

```bash
# Install Playwright and browsers
npm install -D @playwright/test
npx playwright install
```

### Configuration

Our Playwright configuration (`playwright.config.ts`) includes:

```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e-tests',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
};

export default config;
```

## Test Organization

### Directory Structure

```
e2e-tests/
├── fixtures/           # Test data and fixtures
├── helpers/            # Helper functions
├── models/             # Page object models
├── specs/              # Test specifications
│   ├── auth/           # Authentication tests
│   ├── lessons/        # Lesson-related tests
│   └── payments/       # Payment-related tests
└── utils/              # Utility functions
```

### Page Object Model

We use the Page Object Model pattern to organize test code:

```typescript
// models/LessonPage.ts
import { Page, Locator } from '@playwright/test';

export class LessonPage {
  readonly page: Page;
  readonly titleHeading: Locator;
  readonly purchaseButton: Locator;
  readonly videoPlayer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleHeading = page.locator('h1.lesson-title');
    this.purchaseButton = page.locator('[data-testid="purchase-button"]');
    this.videoPlayer = page.locator('[data-testid="video-player"]');
  }

  async goto(lessonId: string) {
    await this.page.goto(`/lessons/${lessonId}`);
  }

  async purchaseLesson() {
    await this.purchaseButton.click();
    // Complete purchase flow...
  }

  async isVideoPlayable() {
    return this.videoPlayer.isVisible();
  }
}
```

## Test Patterns

### Authentication

```typescript
// Example authentication test
import { test, expect } from '@playwright/test';
import { LoginPage } from '../models/LoginPage';

test.describe('Authentication', () => {
  test('should allow user to sign in', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test-user@example.com', 'password123');
    
    // Verify successful login
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
});
```

### Data-Driven Testing

```typescript
// Example data-driven test
import { test, expect } from '@playwright/test';
import { LessonPage } from '../models/LessonPage';

const testCases = [
  { lessonId: 'lesson-1', title: 'Beginner Kendama Techniques' },
  { lessonId: 'lesson-2', title: 'Intermediate Kendama Skills' },
  { lessonId: 'lesson-3', title: 'Advanced Kendama Mastery' },
];

for (const { lessonId, title } of testCases) {
  test(`should display correct title for ${lessonId}`, async ({ page }) => {
    const lessonPage = new LessonPage(page);
    await lessonPage.goto(lessonId);
    
    await expect(lessonPage.titleHeading).toHaveText(title);
  });
}
```

### API Testing with Playwright

```typescript
// Example API test
import { test, expect } from '@playwright/test';

test('API should return lesson data', async ({ request }) => {
  const response = await request.get('/api/lessons/lesson-1');
  
  expect(response.status()).toBe(200);
  
  const data = await response.json();
  expect(data).toHaveProperty('title');
  expect(data).toHaveProperty('description');
  expect(data).toHaveProperty('price');
});
```

## Test Data Management

### Fixtures

```typescript
// Example fixture
import { test as base } from '@playwright/test';
import { LessonPage } from '../models/LessonPage';
import { LoginPage } from '../models/LoginPage';

type TestFixtures = {
  lessonPage: LessonPage;
  loginPage: LoginPage;
  loggedInPage: Page;
};

export const test = base.extend<TestFixtures>({
  lessonPage: async ({ page }, use) => {
    await use(new LessonPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  loggedInPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test-user@example.com', 'password123');
    await use(page);
  },
});
```

### Test Hooks

```typescript
// Example test hooks
import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Set up test environment
  await page.goto('/');
});

test.afterEach(async ({ page }) => {
  // Clean up after test
});
```

## Visual Testing

```typescript
// Example visual test
import { test, expect } from '@playwright/test';

test('lesson page visual appearance', async ({ page }) => {
  await page.goto('/lessons/lesson-1');
  
  // Compare screenshot with baseline
  await expect(page).toHaveScreenshot('lesson-page.png');
});
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up test data after each test
- Avoid dependencies between tests

### 2. Reliable Selectors

- Use data-testid attributes for test selectors
- Avoid brittle selectors like CSS classes that may change
- Use role-based selectors where appropriate

```html
<!-- Good -->
<button data-testid="submit-button">Submit</button>

<!-- Avoid -->
<button class="btn-primary">Submit</button>
```

### 3. Waiting Strategies

- Leverage Playwright's auto-waiting capabilities
- Use explicit assertions for conditions
- Avoid arbitrary timeouts

```typescript
// Good
await expect(page.locator('[data-testid="result"]')).toBeVisible();

// Avoid
await page.waitForTimeout(2000);
```

### 4. Error Handling

- Add descriptive assertions
- Use try/catch for expected errors
- Add custom error messages

### 5. Performance Considerations

- Run tests in parallel
- Use test sharding in CI
- Minimize browser instances

## Debugging Techniques

### Playwright Inspector

```bash
# Run tests with inspector
PWDEBUG=1 npx playwright test
```

### Trace Viewer

```typescript
// Capture traces
test('example test', async ({ page }) => {
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  
  // Test steps...
  
  await page.context().tracing.stop({ path: 'trace.zip' });
});
```

### Screenshots and Videos

```typescript
// Capture screenshot
await page.screenshot({ path: 'screenshot.png' });
```

## Reporting

### HTML Reporter

```bash
npx playwright test --reporter=html
```

### Custom Reporter Integration

```typescript
// Example custom reporter
import { Reporter } from '@playwright/test/reporter';

class MyReporter implements Reporter {
  onBegin(config, suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }
  
  onTestBegin(test) {
    console.log(`Starting test ${test.title}`);
  }
  
  onTestEnd(test, result) {
    console.log(`Finished test ${test.title}: ${result.status}`);
  }
  
  onEnd(result) {
    console.log(`Finished the run: ${result.status}`);
  }
}

export default MyReporter;
```

## Maintenance Strategy

- Regular review of test stability
- Refactoring of flaky tests
- Updating selectors when UI changes
- Periodic review of test coverage

This document provides a comprehensive guide to test automation with Playwright. For specific implementation details, refer to the example tests in the e2e-tests directory.
