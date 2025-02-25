import { test, expect } from '@playwright/test';

test.describe('Authentication flows', () => {
  test('User can sign up with email', async ({ page }) => {
    // Generate a unique email for testing
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    
    // Navigate to home page
    await page.goto('/');
    
    // Open auth dialog
    await page.click('[data-testid="sign-up-button"]');
    
    // Fill in sign up form
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.fill('[data-testid="full-name-input"]', 'Test User');
    
    // Submit form
    await page.click('[data-testid="submit-sign-up"]');
    
    // Verify successful sign up (redirected to dashboard or profile completion)
    await page.waitForURL(/.*dashboard|profile.*/);
    
    // Verify user is logged in (avatar or user menu is visible)
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
  
  test('User can log in with email', async ({ page }) => {
    // Use test account credentials
    const testEmail = 'existing-user@example.com';
    const testPassword = 'ExistingPassword123!';
    
    // Navigate to home page
    await page.goto('/');
    
    // Open auth dialog
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in login form
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    
    // Submit form
    await page.click('[data-testid="submit-sign-in"]');
    
    // Verify successful login
    await page.waitForURL(/.*dashboard.*/);
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
  
  test('User sees error with invalid credentials', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Open auth dialog
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in login form with invalid credentials
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
    
    // Submit form
    await page.click('[data-testid="submit-sign-in"]');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="auth-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error-message"]')).toContainText('Invalid credentials');
  });
});
