# Development Workflow

This guide outlines the development workflow for the Teach Niche platform, emphasizing our Test Driven Development (TDD) approach and integration with third-party APIs.

## Development Lifecycle

### 1. Feature Planning

1. **Understand Requirements**
   - Review user stories and acceptance criteria
   - Clarify any ambiguities with product team
   - Identify potential technical challenges

2. **Design Planning**
   - Consider architectural implications
   - Identify required components and services
   - Plan data models and state management
   - Consider security and performance implications

### 2. Test-First Development (TDD)

1. **Write Tests First**
   - Start with unit tests for individual components and functions
   - Write integration tests for component interactions
   - Create end-to-end tests for complete user journeys
   - Include tests for third-party API integrations

2. **Test Types to Include**
   - **Unit Tests**: Test individual functions and components
   - **Integration Tests**: Test interactions between components
   - **E2E Tests**: Test complete user flows with Playwright
   - **API Tests**: Test interactions with third-party services

3. **Third-Party API Testing Progression**
   - Start with mock responses for basic functionality
   - Progress to tests with actual API calls to verify correct integration
   - Include error handling and edge cases
   - Document required API keys and setup

### 3. Implementation

1. **Implement Minimum Viable Code**
   - Write the minimum code needed to pass tests
   - Focus on functionality first, optimization later
   - Follow established patterns and coding standards

2. **Refactor**
   - Improve code quality while maintaining passing tests
   - Optimize for performance and readability
   - Ensure proper error handling

3. **Documentation**
   - Update documentation as needed
   - Add inline comments for complex logic
   - Document API changes

### 4. Code Review

1. **Prepare for Review**
   - Ensure all tests pass
   - Verify code meets standards
   - Self-review changes

2. **Submit for Review**
   - Create a pull request with a clear description
   - Link to relevant issues or tickets
   - Highlight any architectural decisions or trade-offs

3. **Address Feedback**
   - Respond to review comments
   - Make requested changes
   - Ensure tests still pass after changes

### 5. Integration and Deployment

1. **Merge to Development**
   - Merge approved PR to the development branch
   - Verify integration tests pass

2. **Staging Deployment**
   - Deploy to staging environment
   - Perform manual verification
   - Test with actual third-party services

3. **Production Deployment**
   - Deploy to production
   - Monitor for issues
   - Verify critical functionality

## Git Workflow

### Branch Naming

- Feature branches: `feature/descriptive-name`
- Bug fixes: `fix/issue-description`
- Documentation: `docs/what-is-changing`
- Refactoring: `refactor/what-is-changing`

### Commit Messages

- Use conventional commit format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(auth): add two-factor authentication`

### Pull Requests

- Create one PR per feature or fix
- Keep PRs focused and reasonably sized
- Include tests with all PRs
- Link to relevant issues
- Provide context and testing instructions

## TDD Workflow Example

Here's a practical example of our TDD workflow for adding a new feature:

### Feature: Add Lesson Rating Functionality

1. **Write Tests First**

   ```typescript
   // __tests__/components/LessonRating.test.tsx
   import { render, screen, fireEvent } from '@testing-library/react'
   import { LessonRating } from '@/components/LessonRating'
   
   describe('LessonRating', () => {
     it('should display 5 empty stars initially', () => {
       render(<LessonRating lessonId="123" />)
       const stars = screen.getAllByTestId('rating-star')
       expect(stars).toHaveLength(5)
       stars.forEach(star => {
         expect(star).toHaveAttribute('data-filled', 'false')
       })
     })
     
     it('should fill stars when clicked', () => {
       render(<LessonRating lessonId="123" />)
       const stars = screen.getAllByTestId('rating-star')
       fireEvent.click(stars[2]) // Click the 3rd star
       
       // First 3 stars should be filled
       for (let i = 0; i < 3; i++) {
         expect(stars[i]).toHaveAttribute('data-filled', 'true')
       }
       
       // Last 2 stars should be empty
       for (let i = 3; i < 5; i++) {
         expect(stars[i]).toHaveAttribute('data-filled', 'false')
       }
     })
     
     it('should call API when rating is submitted', async () => {
       const mockSubmit = jest.fn()
       render(<LessonRating lessonId="123" onSubmit={mockSubmit} />)
       
       const stars = screen.getAllByTestId('rating-star')
       fireEvent.click(stars[3]) // 4-star rating
       
       const submitButton = screen.getByRole('button', { name: /submit/i })
       fireEvent.click(submitButton)
       
       expect(mockSubmit).toHaveBeenCalledWith("123", 4)
     })
   })
   ```

2. **Write E2E Test**

   ```typescript
   // e2e-tests/lesson-rating.spec.ts
   import { test, expect } from '@playwright/test'
   
   test('user can rate a lesson', async ({ page }) => {
     // Login first
     await page.goto('/login')
     await page.fill('[data-testid="email-input"]', 'test@example.com')
     await page.fill('[data-testid="password-input"]', 'password123')
     await page.click('[data-testid="login-button"]')
     
     // Navigate to a lesson
     await page.goto('/lessons/test-lesson-123')
     
     // Find and click the 4th star
     const stars = page.locator('[data-testid="rating-star"]')
     await stars.nth(3).click()
     
     // Submit the rating
     await page.click('[data-testid="submit-rating"]')
     
     // Verify success message
     await expect(page.locator('[data-testid="rating-success"]')).toBeVisible()
     
     // Verify the rating was saved (page should show the user's rating)
     await expect(stars.nth(3)).toHaveAttribute('data-filled', 'true')
     await expect(stars.nth(4)).toHaveAttribute('data-filled', 'false')
   })
   ```

3. **Write Third-Party API Test**

   ```typescript
   // __tests__/api/lesson-rating.test.ts
   import { db as firebaseDb } from '@/lib/firebase-admin'
   import { submitRating } from '@/lib/api/ratings'
   
   // This test uses the actual Firebase test environment
   describe('Lesson Rating API', () => {
     beforeEach(async () => {
       // Login with test user
       await firebaseAuth.signInWithEmailAndPassword(
         process.env.TEST_USER_EMAIL!,
         process.env.TEST_USER_PASSWORD!
       )
     })
     
     afterEach(async () => {
       // Clean up test data
       const ratingRef = firebaseDb.collection("lesson_ratings")
         .where('lesson_id', '==', 'test-lesson-id');
       const snapshot = await ratingRef.get();
       const batch = firebaseDb.batch();
       snapshot.forEach(doc => {
         batch.delete(doc.ref);
       });
       await batch.commit();
     })
     
     it('should save rating to Firebase', async () => {
       // Submit a rating using our API function
       await submitRating('test-lesson-id', 4)
       
       // Verify the rating was saved in Firebase
       const ratingRef = firebaseDb.collection("lesson_ratings")
         .where('lesson_id', '==', 'test-lesson-id');
       const snapshot = await ratingRef.get();
       
       expect(snapshot.empty).toBe(false);
       expect(snapshot.docs[0].data().rating).toBe(4);
     })
   })
   ```

4. **Implement the Feature**

   Only after all tests are written, implement the actual feature to make the tests pass.

## Testing Third-Party APIs

### Stripe Testing

```typescript
// Example of testing Stripe payment integration
import { test, expect } from '@playwright/test'

test('user can purchase a lesson', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL!)
  await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD!)
  await page.click('[data-testid="login-button"]')
  
  // Go to a premium lesson
  await page.goto('/lessons/premium-test-lesson')
  
  // Click purchase button
  await page.click('[data-testid="purchase-button"]')
  
  // Fill in Stripe test card details in the iframe
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]')
  await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242')
  await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30')
  await stripeFrame.locator('[placeholder="CVC"]').fill('123')
  
  // Complete purchase
  await page.click('[data-testid="complete-purchase"]')
  
  // Verify success and access to content
  await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible()
  await expect(page.locator('[data-testid="lesson-video-player"]')).toBeVisible()
  
  // Verify purchase in database (separate test)
})
```

### Supabase Testing

```typescript
// Example of testing Supabase authentication
import { test, expect } from '@playwright/test'

test('user can sign up and create profile', async ({ page }) => {
  // Generate unique test email
  const testEmail = `test-${Date.now()}@example.com`
  
  // Go to signup page
  await page.goto('/signup')
  
  // Fill signup form
  await page.fill('[data-testid="name-input"]', 'Test User')
  await page.fill('[data-testid="email-input"]', testEmail)
  await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
  await page.click('[data-testid="signup-button"]')
  
  // Verify redirect to profile setup
  await expect(page).toHaveURL(/\/profile\/setup/)
  
  // Complete profile setup
  await page.fill('[data-testid="bio-input"]', 'Test bio for new user')
  await page.selectOption('[data-testid="interests-select"]', ['kendama', 'tutorials'])
  await page.click('[data-testid="save-profile"]')
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/)
  
  // Verify user data in Supabase (separate test)
})
```

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-24 | Development Team | Initial version |
| 1.1 | 2025-02-26 | Documentation Team | Updated to emphasize TDD and third-party API testing |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
