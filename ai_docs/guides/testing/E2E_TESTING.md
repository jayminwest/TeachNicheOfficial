# End-to-End Testing Guide

This guide outlines the end-to-end (E2E) testing approach for the Teach Niche platform, with a focus on testing third-party API integrations.

## Overview

End-to-end testing verifies that the entire application works as expected from a user's perspective. Our E2E tests use Playwright to automate browser interactions and verify complete user journeys.

## Test Driven Development Approach

Following our TDD principles, E2E tests should be written before implementing features:

1. Write E2E tests that define the expected user journey
2. Verify tests fail (Red phase)
3. Implement the feature to make tests pass (Green phase)
4. Refactor while maintaining passing tests (Refactor phase)

## Setting Up Playwright

### Installation

Playwright is already configured in the project. If you need to reinstall:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Configuration

The Playwright configuration is in `playwright.config.ts`:

```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e-tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
  ],
};

export default config;
```

## Writing E2E Tests

### Test Structure

Place E2E tests in the `e2e-tests` directory at the project root. Organize tests by feature or user journey:

```
e2e-tests/
  auth/
    login.spec.ts
    signup.spec.ts
  lessons/
    browse-lessons.spec.ts
    purchase-lesson.spec.ts
  profile/
    update-profile.spec.ts
```

### Basic Test Example

```typescript
// e2e-tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in login form
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  
  // Submit form
  await page.click('[data-testid="login-button"]');
  
  // Verify successful login
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-greeting"]')).toContainText('Welcome');
});
```

## Testing Third-Party API Integrations

### Progressive Testing Approach

For third-party integrations, follow a progressive testing approach:

1. **Start with basic mocked tests**: Test the UI flow with mocked responses
2. **Add integration tests**: Test the actual API integration in a controlled environment
3. **Include error handling**: Test how the application handles API errors
4. **Test edge cases**: Verify behavior with unusual or boundary inputs

### Environment Setup

Create separate test environments for third-party integrations:

```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
STRIPE_SECRET_KEY=sk_test_your_test_key
MUX_TOKEN_ID=your_test_token_id
MUX_TOKEN_SECRET=your_test_token_secret
```

### Stripe Integration Testing

```typescript
// e2e-tests/payments/purchase-lesson.spec.ts
import { test, expect } from '@playwright/test';

test('user can purchase a lesson with Stripe', async ({ page }) => {
  // Login first
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD || 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Navigate to a premium lesson
  await page.goto('/lessons/premium-test-lesson');
  
  // Verify lesson requires purchase
  await expect(page.locator('[data-testid="purchase-required"]')).toBeVisible();
  
  // Click purchase button
  await page.click('[data-testid="purchase-button"]');
  
  // Verify Stripe checkout appears
  await expect(page.locator('[data-testid="stripe-checkout"]')).toBeVisible();
  
  // Fill in Stripe test card details in the iframe
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
  await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
  await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
  await stripeFrame.locator('[placeholder="CVC"]').fill('123');
  
  // Complete purchase
  await page.click('[data-testid="complete-purchase"]');
  
  // Verify success and access to content
  await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="lesson-video-player"]')).toBeVisible();
  
  // Verify purchase record in database (requires API call or DB check)
  // This could be a separate test or part of this test depending on your approach
});

test('handles declined payment correctly', async ({ page }) => {
  // Similar setup to above test
  
  // Use a declined test card
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
  await stripeFrame.locator('[placeholder="Card number"]').fill('4000000000000002'); // Declined card
  await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
  await stripeFrame.locator('[placeholder="CVC"]').fill('123');
  
  // Attempt purchase
  await page.click('[data-testid="complete-purchase"]');
  
  // Verify error handling
  await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="payment-error"]')).toContainText('card was declined');
});
```

### Supabase Integration Testing

```typescript
// e2e-tests/auth/signup.spec.ts
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Helper to clean up test users
async function deleteTestUser(email: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase credentials not available, skipping user cleanup');
    return;
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (data?.id) {
      await firebaseAuth.admin.deleteUser(data.id);
    }
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
}

test('user can sign up and create profile', async ({ page }) => {
  // Generate unique test email
  const testEmail = `test-${Date.now()}@example.com`;
  
  // Clean up any existing user with this email (just in case)
  await deleteTestUser(testEmail);
  
  // Go to signup page
  await page.goto('/signup');
  
  // Fill signup form
  await page.fill('[data-testid="name-input"]', 'Test User');
  await page.fill('[data-testid="email-input"]', testEmail);
  await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
  await page.click('[data-testid="signup-button"]');
  
  // Verify email verification screen
  await expect(page.locator('[data-testid="verification-required"]')).toBeVisible();
  
  // In a real test, you might:
  // 1. Use Supabase admin API to confirm the user directly
  // 2. Check the database to verify the user was created
  // 3. Use a test email service to retrieve the verification link
  
  // For this example, we'll simulate email verification using the admin API
  if (process.env.SUPABASE_SERVICE_KEY) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Confirm user's email
    await firebaseAuth.admin.updateUserById(
      // You would need to retrieve the user ID first
      'user-id',
      { email_confirm: true }
    );
    
    // Refresh the page to simulate clicking the verification link
    await page.reload();
    
    // Verify redirect to profile setup
    await expect(page).toHaveURL(/\/profile\/setup/);
    
    // Complete profile setup
    await page.fill('[data-testid="bio-input"]', 'Test bio for new user');
    await page.selectOption('[data-testid="interests-select"]', ['kendama', 'tutorials']);
    await page.click('[data-testid="save-profile"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  } else {
    console.log('Skipping email verification steps - no service key available');
  }
  
  // Clean up - delete test user
  await deleteTestUser(testEmail);
});
```

### Mux Video Integration Testing

```typescript
// e2e-tests/lessons/video-upload.spec.ts
import { test, expect } from '@playwright/test';
import * as path from 'path';

test('creator can upload and publish a video lesson', async ({ page }) => {
  // Login as a creator
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', process.env.TEST_CREATOR_EMAIL || 'creator@example.com');
  await page.fill('[data-testid="password-input"]', process.env.TEST_CREATOR_PASSWORD || 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Navigate to lesson creation
  await page.goto('/dashboard/lessons/new');
  
  // Fill in lesson details
  await page.fill('[data-testid="lesson-title"]', 'Test Video Lesson');
  await page.fill('[data-testid="lesson-description"]', 'This is a test video lesson');
  await page.fill('[data-testid="lesson-price"]', '9.99');
  
  // Upload video file
  const fileInput = page.locator('[data-testid="video-upload-input"]');
  await fileInput.setInputFiles(path.join(__dirname, '../../test-assets/sample-video.mp4'));
  
  // Wait for upload to complete
  await expect(page.locator('[data-testid="upload-progress"]')).toHaveText('100%', { timeout: 30000 });
  await expect(page.locator('[data-testid="upload-status"]')).toHaveText('Processing');
  
  // Wait for processing to complete (this might take some time with real Mux)
  await expect(page.locator('[data-testid="upload-status"]')).toHaveText('Ready', { timeout: 60000 });
  
  // Submit the lesson
  await page.click('[data-testid="publish-lesson"]');
  
  // Verify success
  await expect(page.locator('[data-testid="publish-success"]')).toBeVisible();
  
  // Verify the lesson appears in the creator's dashboard
  await page.goto('/dashboard/lessons');
  await expect(page.locator('text=Test Video Lesson')).toBeVisible();
  
  // Clean up - delete the test lesson
  // This would require an API call or database operation
});
```

## Running E2E Tests

### Basic Commands

```bash
# Run all E2E tests
npx playwright test

# Run a specific test file
npx playwright test e2e-tests/auth/login.spec.ts

# Run tests with a specific tag
npx playwright test --grep @payment

# Run tests in UI mode
npx playwright test --ui

# Run tests in debug mode
npx playwright test --debug
```

### Running Tests with Third-Party APIs

```bash
# Run tests that interact with actual third-party APIs
RUN_ACTUAL_API_TESTS=true npx playwright test

# Run specific third-party integration tests
RUN_ACTUAL_API_TESTS=true npx playwright test e2e-tests/payments/
```

## Test Data Management

### Test Data Principles

1. **Isolation**: Each test should create and clean up its own data
2. **Deterministic**: Tests should not depend on existing data
3. **Realistic**: Test data should resemble real-world data
4. **Minimal**: Use only the data needed for the test

### Creating Test Data

```typescript
// Helper function to create a test lesson
async function createTestLesson(title: string, price: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      title,
      description: 'Test lesson description',
      price,
      creator_id: process.env.TEST_CREATOR_ID,
      status: 'published'
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Helper function to clean up test data
async function deleteTestLesson(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  await supabase
    .from('lessons')
    .delete()
    .eq('id', id);
}

// Use in tests
test('user can view lesson details', async ({ page }) => {
  // Create test data
  const lesson = await createTestLesson('Test Lesson', 9.99);
  
  // Run test
  await page.goto(`/lessons/${lesson.id}`);
  await expect(page.locator('[data-testid="lesson-title"]')).toHaveText('Test Lesson');
  
  // Clean up
  await deleteTestLesson(lesson.id);
});
```

## Best Practices

1. **Write Tests First**: Follow TDD principles and write tests before implementing features
2. **Test Real User Journeys**: Focus on testing complete user flows
3. **Use Test IDs**: Add `data-testid` attributes to elements for reliable selection
4. **Handle Asynchronous Operations**: Use proper waiting and assertions for async operations
5. **Clean Up Test Data**: Always clean up data created during tests
6. **Test Error States**: Verify the application handles errors gracefully
7. **Keep Tests Independent**: Each test should run independently of others
8. **Use Realistic Data**: Test with data that resembles real-world usage
9. **Test Across Browsers**: Run tests on multiple browsers to ensure compatibility
10. **Progressive Third-Party Testing**: Start with basic tests and progressively add tests with actual API calls

## Troubleshooting

### Common Issues

1. **Tests Timing Out**: Increase timeout values or improve waiting strategies
2. **Selector Not Found**: Verify selectors and add appropriate waits
3. **Authentication Issues**: Ensure test users have the correct permissions
4. **API Rate Limiting**: Use test accounts with higher rate limits or mock responses
5. **Flaky Tests**: Identify and fix race conditions or timing issues

### Debugging Tips

1. **Use Visual Debugging**: Run tests with `--debug` flag
2. **Add Screenshots**: Use `page.screenshot()` at key points
3. **Check Logs**: Review browser console logs with `page.on('console')`
4. **Slow Down Tests**: Use `page.setDefaultTimeout()` to increase timeouts
5. **Trace Viewer**: Use Playwright Trace Viewer to analyze test execution

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Testing Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to emphasize TDD and third-party API testing |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
