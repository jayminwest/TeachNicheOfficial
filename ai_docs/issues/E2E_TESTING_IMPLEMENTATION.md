# Issue Report: Implement End-to-End Testing for Critical User Flows

## Issue Description

We need to implement comprehensive end-to-end (E2E) tests for all critical user flows in the Teach Niche platform. While we have some tests for the Stripe Connect flow, we lack automated testing for many key user journeys, which increases the risk of regressions and makes it difficult to ensure consistent functionality across the application.

### Technical Analysis

Our current E2E testing setup uses Playwright with Chromium and is configured to run tests from the `./e2e` directory. We have a helper for authentication that mocks the login state, and we've implemented tests for the Stripe Connect flow. We need to expand this approach to cover all critical user journeys.

These tests should follow our existing patterns:
1. Use mocked authentication via localStorage when appropriate
2. Mock external service calls (Stripe, Mux) to avoid actual API calls
3. Test both authenticated and unauthenticated states
4. Verify success and error scenarios
5. Use clear, descriptive test names

## Proposed Test Implementation Plan

We should implement E2E tests in the following order of priority, matching the natural user journey:

### 1. Authentication Flows (expand existing)
- User registration (actual flow, not just mocked)
- User login (actual flow, not just mocked)
- Password reset
- OAuth authentication (if applicable)
- Session persistence
- Logout

### 2. Profile Management
- View profile
- Edit profile information
- Upload profile picture
- Update social media links
- Delete account (if applicable)

### 3. Request Creation and Interaction
- Create lesson requests
- Browse existing requests
- Vote on requests
- Filter and sort requests
- Comment on requests (if applicable)

### 4. Creator Onboarding (expand existing)
- Complete Stripe Connect onboarding (build on existing tests)
- Verify account status across supported countries
- Handle verification requirements
- Test account updates

### 5. Lesson Creation and Management
- Create new lessons
- Upload video content
- Edit lesson details
- Add pricing
- Publish/unpublish lessons
- Delete lessons

### 6. Lesson Purchase and Consumption
- Browse available lessons
- View lesson details
- Purchase lessons through Stripe
- Access purchased content
- View video content
- Rate and review lessons

### 7. Financial Flows
- Verify creator earnings calculation
- Test payout processes
- Handle refunds (if applicable)

## Testing Requirements

For each flow, tests should:
1. Follow our existing pattern using Playwright
2. Use the authentication helper when needed
3. Mock external services appropriately
4. Include both positive and negative test cases
5. Be independent and idempotent
6. Run in our existing test environment

## Environment Details

- Testing Framework: Playwright (as configured in playwright.config.ts)
- Browser Coverage: Currently Chromium only
- Test Environment: Local development server running on port 3000
- Mock Services: Stripe, Mux, and other external dependencies

## Affected Files

New test files will be created in the e2e directory, following our existing structure:

```
e2e/
├── auth/
│   ├── registration.spec.ts
│   ├── login.spec.ts
│   └── password-reset.spec.ts
├── profile/
│   ├── view-profile.spec.ts
│   └── edit-profile.spec.ts
├── requests/
│   ├── create-request.spec.ts
│   └── vote-request.spec.ts
├── creator/
│   ├── stripe-connect.spec.ts (existing)
│   └── account-verification.spec.ts
├── lessons/
│   ├── create-lesson.spec.ts
│   ├── edit-lesson.spec.ts
│   └── publish-lesson.spec.ts
├── purchases/
│   ├── buy-lesson.spec.ts
│   └── view-purchased-content.spec.ts
├── helpers/
│   ├── auth.ts (existing)
│   ├── lessons.ts
│   └── requests.ts
```

## Implementation Details

### Authentication Tests (auth/)

```typescript
// Example structure for registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should allow a new user to register', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to registration view
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Fill registration form
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/password/i).fill('SecurePassword123');
    await page.getByLabel(/confirm password/i).fill('SecurePassword123');
    
    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Verify successful registration
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('should show error for existing email', async ({ page }) => {
    // Implementation details
  });

  test('should validate password requirements', async ({ page }) => {
    // Implementation details
  });
});
```

### Profile Management Tests (profile/)

```typescript
// Example structure for edit-profile.spec.ts
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Profile Editing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/profile');
  });

  test('should allow user to update profile information', async ({ page }) => {
    // Click edit button
    await page.getByRole('button', { name: /edit profile/i }).click();
    
    // Update profile information
    await page.getByLabel(/name/i).fill('Updated Name');
    await page.getByLabel(/bio/i).fill('This is my updated bio');
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify changes were saved
    await expect(page.getByText('Updated Name')).toBeVisible();
    await expect(page.getByText('This is my updated bio')).toBeVisible();
  });

  // Additional tests for other profile editing functionality
});
```

## Additional Context

These tests will build upon our existing E2E testing infrastructure. We should maintain the same patterns established in the Stripe Connect tests, including:

1. Using the login helper for authenticated tests
2. Mocking external service calls
3. Testing both success and error scenarios
4. Using clear, descriptive test names

The implementation should follow the TDD approach outlined in our documentation, writing tests before implementing new features or fixing bugs.

## Testing Requirements

After implementing each test suite:
1. Verify tests pass consistently in local development
2. Ensure tests run successfully in the CI pipeline
3. Confirm tests are resilient to minor UI changes
4. Document any environment-specific setup required

## Implementation Timeline

We should prioritize implementing these tests in the order listed, with authentication flows being the most critical as they are prerequisites for most other functionality.

## Labels
- enhancement
- testing
- good first issue

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-07 | Documentation Team | Initial issue report |
