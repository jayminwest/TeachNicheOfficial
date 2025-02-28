import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign in and sign out', async ({ page }) => {
    await page.goto('/signin');
    
    // Test successful sign in
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('[data-testid="user-email"]')).toHaveText('test@example.com');

    // Test sign out
    await page.click('[data-testid="sign-out-button"]');
    await expect(page).toHaveURL('/signin');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should persist session after refresh', async ({ page }) => {
    await page.goto('/signin');
    
    // Sign in first
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Refresh page
    await page.reload();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should redirect authenticated users away from signin', async ({ page }) => {
    // First sign in
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Try to access signin again
    await page.goto('/signin');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('visual regression: signin page', async ({ page }) => {
    await page.goto('/signin');
    await expect(page).toHaveScreenshot('signin-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01
    });
  });
});
