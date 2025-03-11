# Playwright Testing Guide

This guide provides practical instructions for writing, running, and maintaining Playwright tests for the Teach Niche platform.

## Getting Started

### Installation

Playwright is already configured in our project. If you're setting up a new environment, run:

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test e2e-tests/lesson-purchase.spec.ts

# Run tests with UI mode
npx playwright test --ui

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests in a specific browser
npx playwright test --project=chromium
```

## Writing Your First Test

### Basic Test Structure

Create a new file in the `e2e-tests` directory with a `.spec.ts` extension:

```typescript
// e2e-tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  // Navigate to a page
  await page.goto('/');
  
  // Interact with the page
  await page.click('[data-testid="sign-in-button"]');
  
  // Assert something
  await expect(page.locator('h2')).toContainText('Sign In');
});
```

### Page Object Model

We use the Page Object Model pattern to organize our tests:

```typescript
// e2e-tests/models/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="submit-sign-in"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.click('[data-testid="sign-in-button"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// Using the page object in a test
import { test, expect } from '@playwright/test';
import { LoginPage } from '../models/LoginPage';

test('user can log in', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  
  await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
});
```

## Common Testing Patterns

### Authentication

We have a helper for authentication to avoid repeating login steps:

```typescript
// e2e-tests/utils/auth-helpers.ts
import { Page } from '@playwright/test';
import { LoginPage } from '../models/LoginPage';

export async function loginAsUser(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.waitForSelector('[data-testid="user-avatar"]');
}

// Using the helper in a test
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';

test('authenticated user can access dashboard', async ({ page }) => {
  await loginAsUser(page, 'test@example.com', 'password123');
  await page.goto('/dashboard');
  
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Authentication State Reuse

To speed up tests, we can reuse authentication state:

```typescript
// e2e-tests/auth.setup.ts
import { test as setup } from '@playwright/test';
import { LoginPage } from './models/LoginPage';

setup('authenticate as user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  
  // Save storage state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // ... other config
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'authenticated',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],
});
```

### Testing Forms

```typescript
import { test, expect } from '@playwright/test';

test('user can submit a form', async ({ page }) => {
  await page.goto('/contact');
  
  // Fill form fields
  await page.fill('[data-testid="name-input"]', 'Test User');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="message-input"]', 'This is a test message');
  
  // Submit form
  await page.click('[data-testid="submit-button"]');
  
  // Verify success message
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### Testing API Responses

```typescript
import { test, expect } from '@playwright/test';

test('API returns correct data', async ({ request }) => {
  const response = await request.get('/api/lessons');
  
  expect(response.status()).toBe(200);
  
  const data = await response.json();
  expect(data.lessons.length).toBeGreaterThan(0);
  expect(data.lessons[0]).toHaveProperty('title');
});
```

### Mocking API Responses

```typescript
import { test, expect } from '@playwright/test';

test('handles API error gracefully', async ({ page }) => {
  // Mock API response
  await page.route('/api/lessons', async (route) => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });
  
  await page.goto('/lessons');
  
  // Verify error message is displayed
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

### Visual Testing

```typescript
import { test, expect } from '@playwright/test';

test('lesson card appears correctly', async ({ page }) => {
  await page.goto('/lessons');
  
  // Take screenshot of a specific element
  await expect(page.locator('.lesson-card').first()).toHaveScreenshot('lesson-card.png');
});
```

## Testing Complex Scenarios

### Payment Flows

```typescript
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';
import { LessonPage } from '../models/LessonPage';
import { CheckoutPage } from '../models/CheckoutPage';

test('user can purchase a lesson', async ({ page }) => {
  await loginAsUser(page, 'test-buyer@example.com', 'TestPassword123!');
  
  const lessonPage = new LessonPage(page);
  await lessonPage.goto('lesson-1');
  await lessonPage.clickPurchaseButton();
  
  const checkoutPage = new CheckoutPage(page);
  
  // Fill Stripe test card details
  await checkoutPage.fillPaymentDetails({
    cardNumber: '4242424242424242',
    expiry: '12/30',
    cvc: '123'
  });
  
  await checkoutPage.submitPayment();
  
  // Verify success
  await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
});
```

### Video Playback

```typescript
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';

test('video player functions correctly', async ({ page }) => {
  await loginAsUser(page, 'test-buyer@example.com', 'TestPassword123!');
  
  // Navigate to a lesson the user has purchased
  await page.goto('/lessons/purchased-lesson-1');
  
  // Wait for video player to load
  await page.waitForSelector('[data-testid="video-player"]:not([data-loading="true"])');
  
  // Click play button
  await page.click('[data-testid="play-button"]');
  
  // Verify video is playing (check for playing attribute or class)
  await expect(page.locator('[data-testid="video-player"]')).toHaveAttribute('data-playing', 'true');
  
  // Test other video controls as needed
});
```

### File Uploads

```typescript
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';
import path from 'path';

test('instructor can upload video', async ({ page }) => {
  await loginAsUser(page, 'test-instructor@example.com', 'TestPassword123!');
  
  await page.goto('/dashboard/lessons/new');
  
  // Fill in lesson details
  await page.fill('[data-testid="title-input"]', 'Test Lesson');
  await page.fill('[data-testid="description-input"]', 'This is a test lesson');
  await page.fill('[data-testid="price-input"]', '19.99');
  
  // Upload video file
  const filePath = path.join(__dirname, '../fixtures/test-video.mp4');
  await page.setInputFiles('[data-testid="video-upload"]', filePath);
  
  // Wait for upload to complete
  await page.waitForSelector('[data-testid="upload-success"]');
  
  // Submit form
  await page.click('[data-testid="submit-button"]');
  
  // Verify success
  await expect(page.locator('[data-testid="lesson-created-success"]')).toBeVisible();
});
```

## Debugging Tests

### Using Playwright Inspector

```bash
# Run with inspector
PWDEBUG=1 npx playwright test e2e-tests/lesson-purchase.spec.ts
```

### Using Trace Viewer

```typescript
// In your test
test('example test', async ({ page }) => {
  // Start tracing
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  
  // Your test steps...
  
  // Stop tracing
  await page.context().tracing.stop({ path: 'trace.zip' });
});

// Or configure in playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry', // or 'on', 'off', 'retain-on-failure'
  },
});
```

To view traces:

```bash
npx playwright show-trace trace.zip
```

### Taking Screenshots

```typescript
// Take a screenshot during test execution
await page.screenshot({ path: 'screenshot.png' });

// Take a screenshot of a specific element
await page.locator('.lesson-card').screenshot({ path: 'lesson-card.png' });
```

## Test Organization

### Using Test Fixtures

```typescript
// e2e-tests/fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from './models/LoginPage';
import { LessonPage } from './models/LessonPage';

type TestFixtures = {
  loginPage: LoginPage;
  lessonPage: LessonPage;
  loggedInPage: {
    page: Page;
    userId: string;
  };
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  lessonPage: async ({ page }, use) => {
    await use(new LessonPage(page));
  },
  loggedInPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await page.waitForSelector('[data-testid="user-avatar"]');
    
    await use({ page, userId: 'test-user-id' });
  },
});

// Using fixtures in tests
import { test } from '../fixtures';
import { expect } from '@playwright/test';

test('user can access dashboard', async ({ loggedInPage }) => {
  const { page } = loggedInPage;
  await page.goto('/dashboard');
  
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Grouping and Tagging Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in', async ({ page }) => {
    // Test implementation
  });
  
  test('user can sign up', async ({ page }) => {
    // Test implementation
  });
});

// Tagging tests
test('user can purchase a lesson @payment @critical', async ({ page }) => {
  // Test implementation
});

// Running tagged tests
// npx playwright test --grep @critical
```

## Best Practices

### 1. Use Data Attributes for Selectors

```html
<!-- Good -->
<button data-testid="submit-button">Submit</button>

<!-- Avoid -->
<button class="btn-primary">Submit</button>
```

```typescript
// Good
await page.click('[data-testid="submit-button"]');

// Avoid
await page.click('.btn-primary');
```

### 2. Isolate Tests

Each test should be independent and not rely on the state from other tests.

### 3. Use Explicit Assertions

```typescript
// Good
await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

// Avoid
await page.waitForTimeout(1000); // Arbitrary wait
```

### 4. Handle Async Operations Properly

```typescript
// Good
await page.waitForSelector('[data-testid="results"]');

// Avoid
await page.waitForTimeout(2000); // Arbitrary wait
```

### 5. Clean Up Test Data

```typescript
test.afterEach(async ({ request }) => {
  // Clean up test data
  await request.delete('/api/test-data');
});
```

## Troubleshooting Common Issues

### 1. Element Not Found

If Playwright can't find an element:

- Check if the selector is correct
- Ensure the element is in the DOM when the action is attempted
- Use `page.waitForSelector()` to wait for the element to appear
- Check if the element is inside an iframe or shadow DOM

### 2. Timing Issues

If tests are flaky due to timing:

- Avoid using `waitForTimeout()`
- Use explicit waiting with `waitForSelector()`, `waitForLoadState()`, etc.
- Check network requests with `page.waitForResponse()`

### 3. Authentication Problems

If tests fail due to authentication issues:

- Verify the login flow works manually
- Check if tokens are being properly stored and sent
- Use storage state to reuse authentication between tests

### 4. Test Data Conflicts

If tests interfere with each other:

- Ensure each test creates its own data
- Clean up data after tests
- Use unique identifiers for test data

## Continuous Integration

Our GitHub Actions workflow runs Playwright tests on every pull request:

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

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Appendix: Example Tests

### Complete Authentication Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="sign-in-button"]');
    await page.click('text=Sign up');
    
    const email = `test-${Date.now()}@example.com`;
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
    await page.click('[data-testid="submit-sign-up"]');
    
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
  
  test('user can sign in', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="sign-in-button"]');
    
    await page.fill('[data-testid="email-input"]', 'test-user@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="submit-sign-in"]');
    
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
  
  test('user can reset password', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="sign-in-button"]');
    await page.click('text=Forgot password?');
    
    await page.fill('[data-testid="email-input"]', 'test-user@example.com');
    await page.click('[data-testid="submit-reset"]');
    
    await expect(page.locator('[data-testid="reset-confirmation"]')).toBeVisible();
  });
});
```

### Complete Lesson Purchase Test

```typescript
import { test, expect } from '@playwright/test';
import { loginAsUser } from '../utils/auth-helpers';

test('complete lesson purchase flow', async ({ page }) => {
  // Login as a user
  await loginAsUser(page, 'test-buyer@example.com', 'TestPassword123!');
  
  // Navigate to lessons page
  await page.goto('/lessons');
  
  // Find and click on a lesson
  await page.click('.lesson-card:first-child');
  
  // Verify lesson details page loaded
  await expect(page.locator('h1.lesson-title')).toBeVisible();
  
  // Click purchase button
  await page.click('[data-testid="purchase-button"]');
  
  // Fill payment details in Stripe iframe
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
  await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
  await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
  await stripeFrame.locator('[placeholder="CVC"]').fill('123');
  
  // Complete purchase
  await page.click('[data-testid="confirm-payment"]');
  
  // Verify success and access to content
  await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
  
  // Verify purchase appears in user's purchases
  await page.goto('/dashboard/purchases');
  await expect(page.locator('.purchase-item')).toContainText(await page.locator('h1.lesson-title').textContent());
});
```

This guide provides a comprehensive reference for writing and maintaining Playwright tests for the Teach Niche platform. For specific implementation details or questions, please reach out to the QA team.
