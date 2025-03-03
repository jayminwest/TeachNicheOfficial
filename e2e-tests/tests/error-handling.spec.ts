import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should show appropriate error for non-existent lesson', async ({ page }) => {
    // Navigate to a non-existent lesson
    await page.goto('/lessons/non-existent-lesson-id');
    
    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Verify error message content
    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText).toContain('not found');
    
    // Check for "Go back" or "Return home" button
    await expect(page.locator('a', { hasText: /home|back/i })).toBeVisible();
  });
  
  test('should handle payment failure gracefully', async ({ page }) => {
    // Load authentication state
    await page.context().storageState({ path: './e2e-tests/test-data/buyerAuth.json' });
    
    // Navigate to a lesson page
    await page.goto('/lessons/test-paid-lesson');
    
    // Click purchase button
    await page.click('[data-testid="purchase-button"]');
    
    // Intercept the Stripe checkout API call and simulate a failure
    await page.route('**/api/stripe/create-checkout-session', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Payment method declined',
            code: 'card_declined'
          }
        })
      });
    });
    
    // Trigger the payment
    await page.click('[data-testid="checkout-button"]');
    
    // Check for error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    
    // Verify error message is user-friendly
    const errorText = await page.locator('[data-testid="payment-error"]').textContent();
    expect(errorText).toContain('payment');
    expect(errorText).not.toContain('undefined');
    expect(errorText).not.toContain('null');
    expect(errorText).not.toMatch(/error \d+/i);
    
    // Check that the UI is still functional
    await expect(page.locator('[data-testid="try-again-button"]')).toBeVisible();
    
    // Verify we can navigate away
    await page.click('[data-testid="try-again-button"]');
    await expect(page).toHaveURL(/\/lessons\/test-paid-lesson/);
  });
  
  test('should handle server errors gracefully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Intercept API calls and simulate a server error
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error'
        })
      });
    });
    
    // Perform an action that triggers an API call
    await page.click('[data-testid="load-more-button"]');
    
    // Check for error message
    await expect(page.locator('[data-testid="error-notification"]')).toBeVisible();
    
    // Verify error message is user-friendly
    const errorText = await page.locator('[data-testid="error-notification"]').textContent();
    expect(errorText).toContain('problem');
    expect(errorText).not.toContain('500');
    expect(errorText).not.toContain('undefined');
    
    // Check that retry functionality works
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Remove the error intercept
    await page.unroute('**/api/**');
    
    // Click retry and verify it works
    await page.click('[data-testid="retry-button"]');
    
    // Verify the error message disappears
    await expect(page.locator('[data-testid="error-notification"]')).not.toBeVisible();
  });
  
  test('should handle form validation errors properly', async ({ page }) => {
    // Navigate to the sign-up page
    await page.goto('/auth/signup');
    
    // Submit the form without filling required fields
    await page.click('[data-testid="submit-sign-up"]');
    
    // Check for validation error messages
    const errorMessages = await page.locator('[data-testid="form-error"]').all();
    expect(errorMessages.length).toBeGreaterThan(0);
    
    // Fill in invalid data
    await page.fill('[data-testid="email-input"]', 'not-an-email');
    await page.fill('[data-testid="password-input"]', 'short');
    
    // Submit again
    await page.click('[data-testid="submit-sign-up"]');
    
    // Check for specific validation messages
    const emailError = await page.locator('[data-testid="email-error"]').textContent();
    expect(emailError).toContain('valid email');
    
    const passwordError = await page.locator('[data-testid="password-error"]').textContent();
    expect(passwordError).toContain('password');
    
    // Fill in valid data
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'ValidPassword123!');
    
    // Verify error messages disappear
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).not.toBeVisible();
  });
});
