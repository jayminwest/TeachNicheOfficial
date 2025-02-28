import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in', async ({ page }) => {
    // Navigate to the site
    await page.goto('/');
    
    // Click sign in button
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in credentials - use test account
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify user is signed in
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Verify navigation to dashboard or profile
    await expect(page).toHaveURL(/\/profile|\/dashboard/);
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to the site
    await page.goto('/');
    
    // Click sign in button
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(/invalid/i);
  });
  
  test('should allow user to sign up', async ({ page }) => {
    // Generate a unique email for testing
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    // Navigate to the site
    await page.goto('/');
    
    // Click sign in button
    await page.click('[data-testid="sign-in-button"]');
    
    // Switch to sign up
    await page.click('text=Don\'t have an account?');
    
    // Fill in sign up form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify user is signed in
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Verify navigation to dashboard or profile
    await expect(page).toHaveURL(/\/profile|\/dashboard/);
  });
  
  test('should allow user to sign out', async ({ page }) => {
    // First sign in
    await page.goto('/');
    await page.click('[data-testid="sign-in-button"]');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for sign in to complete
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Sign out
    await page.click('[data-testid="user-profile"]');
    await page.click('[data-testid="sign-out-button"]');
    
    // Verify user is signed out
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
  });
});
