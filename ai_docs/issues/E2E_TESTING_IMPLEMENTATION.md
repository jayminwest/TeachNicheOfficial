# Issue Report: Implement End-to-End Testing for Critical User Flows

## Issue Description

We need to implement comprehensive end-to-end (E2E) tests for all critical user flows in the Teach Niche platform. While we have a basic test for the Stripe Connect flow, we lack automated testing for many key user journeys, which increases the risk of regressions and makes it difficult to ensure consistent functionality across the application.

### Current Status

**Progress:** In Progress  
**Status:** Blocked by test failures

We've started implementing the E2E tests according to the plan below, but we're encountering issues with the test execution. All tests are currently failing with the following error:

```
SyntaxError: Identifier 'login' has already been declared. (83:22)
```

This issue was caused by duplicate `login` function declarations in the `e2e/helpers/auth.ts` file. We've fixed this issue by removing the duplicate function (commit 13fcd5b), but we need to verify that all tests are now working correctly and continue with the implementation.

### Technical Analysis

Our current E2E testing setup uses Playwright with Chromium and is configured to run tests from the `./e2e` directory. We have a helper for authentication that mocks the login state via localStorage, and we've implemented a test for the Stripe Connect flow. We need to expand this approach to cover all critical user journeys.

Based on analysis of the existing codebase, we need to:
1. Use the existing authentication helper pattern for tests requiring login
2. Mock external service calls (Stripe, Mux) to avoid actual API calls
3. Test both authenticated and unauthenticated states
4. Verify success and error scenarios
5. Use clear, descriptive test names
6. Ensure tests work with the Suspense boundaries used throughout the app

## Detailed Implementation Plan

### Phase 1: Authentication Flow Tests (1-2 days)

#### 1.1 Google Sign-In Flow Test
**File:** `e2e/auth/google-signin.spec.ts`

This test will:
- Mock the Google OAuth flow since we can't test the actual Google authentication
- Verify the sign-in button is visible and clickable
- Mock a successful authentication response
- Verify redirect to the appropriate page after login
- Test error handling for failed authentication

```typescript
// Test structure
test.describe('Google Sign-In', () => {
  test('displays sign-in page correctly', async ({ page }) => {
    // Verify UI elements
  });
  
  test('handles successful sign-in', async ({ page }) => {
    // Mock successful auth
    // Verify redirect
  });
  
  test('handles authentication errors', async ({ page }) => {
    // Mock auth failure
    // Verify error message
  });
});
```

#### 1.2 Authentication Redirect Test
**File:** `e2e/auth/auth-redirect.spec.ts`

This test will:
- Verify that unauthenticated users are redirected to sign-in when accessing protected pages
- Test that the redirect parameter works correctly
- Verify that after authentication, users are sent to the originally requested page

#### 1.3 Session Persistence Test
**File:** `e2e/auth/session-persistence.spec.ts`

This test will:
- Verify that authentication state persists across page navigation
- Test that session is maintained after page refresh
- Verify session expiration behavior

### Phase 2: Profile Management Tests (1-2 days)

#### 2.1 Profile View Test
**File:** `e2e/profile/profile-view.spec.ts`

This test will:
- Use the auth helper to mock a logged-in state
- Navigate to the profile page
- Verify that user information is displayed correctly
- Test that appropriate UI elements are visible based on user role

```typescript
// Test structure
test.describe('Profile View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page); // Using existing auth helper
    await page.goto('/profile');
  });
  
  test('displays user information correctly', async ({ page }) => {
    // Verify profile elements
  });
  
  test('shows creator-specific elements for creators', async ({ page }) => {
    // Mock creator role
    // Verify creator UI elements
  });
});
```

#### 2.2 Profile Edit Test
**File:** `e2e/profile/profile-edit.spec.ts`

This test will:
- Test the profile editing functionality
- Verify form validation
- Test successful profile updates
- Verify error handling for failed updates

### Phase 3: Lesson Request Tests (1-2 days)

#### 3.1 Browse Requests Test
**File:** `e2e/requests/browse-requests.spec.ts`

This test will:
- Verify the requests page loads correctly
- Test filtering and sorting functionality
- Verify pagination works as expected
- Test both authenticated and unauthenticated views

#### 3.2 Create Request Test
**File:** `e2e/requests/create-request.spec.ts`

This test will:
- Test the request creation form
- Verify form validation
- Test successful request submission
- Verify error handling

#### 3.3 Vote on Request Test
**File:** `e2e/requests/vote-request.spec.ts`

This test will:
- Test upvoting and downvoting functionality
- Verify vote count updates
- Test authentication requirements for voting
- Verify error handling

### Phase 4: Lesson Management Tests (2-3 days)

#### 4.1 Create Lesson Test
**File:** `e2e/lessons/create-lesson.spec.ts`

This test will:
- Test the lesson creation form
- Mock video upload functionality
- Verify form validation
- Test successful lesson creation
- Verify error handling

```typescript
// Test structure
test.describe('Lesson Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await login(page, 'creator@example.com');
    await page.goto('/lessons/new');
  });
  
  test('validates required fields', async ({ page }) => {
    // Submit empty form
    // Verify validation messages
  });
  
  test('creates lesson successfully', async ({ page }) => {
    // Fill form with valid data
    // Mock video upload
    // Submit form
    // Verify success
  });
});
```

#### 4.2 Edit Lesson Test
**File:** `e2e/lessons/edit-lesson.spec.ts`

This test will:
- Test editing an existing lesson
- Verify form validation
- Test successful updates
- Verify error handling

#### 4.3 Publish Lesson Test
**File:** `e2e/lessons/publish-lesson.spec.ts`

This test will:
- Test the lesson publishing workflow
- Verify status changes
- Test visibility of published vs. unpublished lessons

### Phase 5: Lesson Purchase and Consumption Tests (2-3 days)

#### 5.1 Browse Lessons Test
**File:** `e2e/lessons/browse-lessons.spec.ts`

This test will:
- Verify the lessons page loads correctly
- Test filtering and sorting functionality
- Verify lesson cards display correctly
- Test both authenticated and unauthenticated views

#### 5.2 Lesson Detail View Test
**File:** `e2e/lessons/lesson-detail.spec.ts`

This test will:
- Verify lesson details page loads correctly
- Test that appropriate UI elements are visible based on purchase status
- Verify creator information is displayed

#### 5.3 Purchase Lesson Test
**File:** `e2e/purchases/purchase-lesson.spec.ts`

This test will:
- Mock the Stripe checkout process
- Test the purchase flow
- Verify successful purchase updates access status
- Test error handling

```typescript
// Test structure
test.describe('Lesson Purchase', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to a lesson detail page
    await page.goto('/lessons/test-lesson-id');
  });
  
  test('shows purchase UI for unpurchased lessons', async ({ page }) => {
    // Verify purchase button is visible
  });
  
  test('handles successful purchase', async ({ page }) => {
    // Mock Stripe checkout success
    // Verify access granted
  });
  
  test('handles failed purchase', async ({ page }) => {
    // Mock Stripe checkout failure
    // Verify error handling
  });
});
```

#### 5.4 Access Purchased Content Test
**File:** `e2e/purchases/access-content.spec.ts`

This test will:
- Verify that purchased content is accessible
- Test video player functionality
- Verify access restrictions for unpurchased content

### Phase 6: Creator Earnings Tests (1-2 days)

#### 6.1 Stripe Connect Onboarding Test
**File:** `e2e/creator/stripe-connect.spec.ts` (Enhance existing)

Enhance the existing test to:
- Test more edge cases
- Verify account status updates
- Test error handling

#### 6.2 Earnings Dashboard Test
**File:** `e2e/creator/earnings-dashboard.spec.ts`

This test will:
- Verify earnings information is displayed correctly
- Test filtering and date range functionality
- Verify calculation accuracy

## Test Helper Files

### 1. Enhanced Authentication Helper
**File:** `e2e/helpers/auth.ts` (Update existing)

Enhance the existing helper to:
- Support different user roles (learner, creator, admin)
- Mock different authentication states
- Handle redirect scenarios

### 2. Lesson Helper
**File:** `e2e/helpers/lessons.ts` (New)

Create a helper to:
- Mock lesson data
- Set up test lessons with different states
- Mock video processing status

```typescript
// Example structure
export async function createMockLesson(page, options = {}) {
  // Set default options
  const defaults = {
    title: 'Test Lesson',
    price: 9.99,
    status: 'published',
    // Other defaults
  };
  
  const settings = { ...defaults, ...options };
  
  // Mock API call to create lesson
  await page.evaluate((data) => {
    // Mock localStorage or API response
  }, settings);
  
  return settings;
}
```

### 3. Stripe Mock Helper
**File:** `e2e/helpers/stripe.ts` (New)

Create a helper to:
- Mock Stripe checkout sessions
- Mock Connect account states
- Simulate webhook events

### 4. Request Helper
**File:** `e2e/helpers/requests.ts` (New)

Create a helper to:
- Mock request data
- Set up test requests with different vote counts
- Mock voting functionality

## Implementation Timeline

1. **Week 1**: Set up enhanced test helpers and implement authentication tests
2. **Week 2**: Implement profile and request tests
3. **Week 3**: Implement lesson management tests
4. **Week 4**: Implement purchase and consumption tests
5. **Week 5**: Implement creator earnings tests and finalize documentation

## Testing Requirements

For all test suites:
1. Tests must be independent and idempotent
2. Use descriptive test names that clearly indicate what's being tested
3. Include both positive and negative test cases
4. Mock external services to avoid actual API calls
5. Handle Suspense boundaries appropriately
6. Verify both UI elements and application state
7. Document any special setup requirements

## Environment Setup

To run these tests locally:

```bash
# Install dependencies
npm install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/auth/google-signin.spec.ts

# Run tests with UI mode for debugging
npx playwright test --ui
```

## Labels
- enhancement
- testing
- good first issue

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-07 | Documentation Team | Initial issue report |
| 1.1 | 2025-03-07 | Documentation Team | Updated with detailed implementation plan |
