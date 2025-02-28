import { test, expect } from '@playwright/test';

// Enable debug mode for more verbose logging
test.setTimeout(60000); // Set timeout to 60 seconds for all tests in this file

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Add debugging information
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    
    // Navigate to the site and wait for it to be fully loaded
    await page.goto('http://localhost:3000/');
    console.log('Page loaded');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });
  
  test('should allow user to sign in', async ({ page }) => {
    console.log('Starting sign in test');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'before-signin.png' });
    
    // Click sign in button - with more reliable selector and waiting
    try {
      // First try data-testid
      await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 5000 });
      await page.click('[data-testid="sign-in-button"]');
    } catch (e) {
      console.log('Could not find by data-testid, trying text content');
      // Fallback to text content
      await page.getByRole('button', { name: /sign in/i }).click();
    }
    
    console.log('Clicked sign in button');
    await page.screenshot({ path: 'after-signin-click.png' });
    
    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"]');
    
    // Fill in credentials - use test account
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'testpassword');
    console.log('Filled credentials');
    
    // Submit form
    await page.click('button[type="submit"]');
    console.log('Submitted form');
    
    // Verify user is signed in - with more reliable selector
    await expect(
      page.locator('[data-testid="user-profile"], .user-profile, .avatar')
    ).toBeVisible({ timeout: 10000 });
    
    // Verify navigation to dashboard or profile
    await expect(page).toHaveURL(/\/profile|\/dashboard/);
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    console.log('Starting invalid credentials test');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'before-invalid-signin.png' });
    
    // Click sign in button - with more reliable selector
    try {
      // First try data-testid
      await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 5000 });
      await page.click('[data-testid="sign-in-button"]');
    } catch (e) {
      console.log('Could not find by data-testid, trying text content');
      // Fallback to text content
      await page.getByRole('button', { name: /sign in/i }).click();
    }
    
    console.log('Clicked sign in button');
    
    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"]');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    console.log('Filled invalid credentials');
    
    // Submit form
    await page.click('button[type="submit"]');
    console.log('Submitted form');
    
    // Verify error message - with more reliable selector
    await expect(
      page.locator('[data-testid="auth-error"], .error-message, .alert-error')
    ).toBeVisible({ timeout: 10000 });
    
    await expect(
      page.locator('[data-testid="auth-error"], .error-message, .alert-error')
    ).toContainText(/invalid|incorrect|wrong/i);
  });
  
  test('should allow user to sign up', async ({ page }) => {
    console.log('Starting sign up test');
    
    // Generate a unique email for testing
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'before-signup.png' });
    
    // Click sign in button - with more reliable selector
    try {
      // First try data-testid
      await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 5000 });
      await page.click('[data-testid="sign-in-button"]');
    } catch (e) {
      console.log('Could not find by data-testid, trying text content');
      // Fallback to text content
      await page.getByRole('button', { name: /sign in/i }).click();
    }
    
    console.log('Clicked sign in button');
    
    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"]');
    
    // Switch to sign up - with more reliable selector
    try {
      await page.click('text=Don\'t have an account?');
    } catch (e) {
      console.log('Could not find by text, trying other selectors');
      await page.click('[data-testid="sign-up-link"], a:has-text("Sign up"), a:has-text("Create account")');
    }
    
    console.log('Switched to sign up');
    await page.screenshot({ path: 'after-signup-switch.png' });
    
    // Wait for the sign up form to be visible
    await page.waitForSelector('input[name="name"], input[placeholder="Name"]');
    
    // Fill in sign up form
    await page.fill('input[name="name"], input[placeholder="Name"]', 'Test User');
    await page.fill('input[type="email"], input[name="email"]', uniqueEmail);
    await page.fill('input[type="password"], input[name="password"]', 'Password123!');
    console.log('Filled sign up form');
    
    // Submit form
    await page.click('button[type="submit"]');
    console.log('Submitted form');
    
    // Verify user is signed in - with more reliable selector
    await expect(
      page.locator('[data-testid="user-profile"], .user-profile, .avatar')
    ).toBeVisible({ timeout: 10000 });
    
    // Verify navigation to dashboard or profile
    await expect(page).toHaveURL(/\/profile|\/dashboard/);
  });
  
  test('should allow user to sign out', async ({ page }) => {
    console.log('Starting sign out test');
    
    // First sign in
    await page.goto('http://localhost:3000/');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'before-signout-signin.png' });
    
    // Click sign in button - with more reliable selector
    try {
      // First try data-testid
      await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 5000 });
      await page.click('[data-testid="sign-in-button"]');
    } catch (e) {
      console.log('Could not find by data-testid, trying text content');
      // Fallback to text content
      await page.getByRole('button', { name: /sign in/i }).click();
    }
    
    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"]');
    
    // Fill in credentials
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'testpassword');
    console.log('Filled credentials');
    
    // Submit form
    await page.click('button[type="submit"]');
    console.log('Submitted form');
    
    // Wait for sign in to complete - with more reliable selector
    await expect(
      page.locator('[data-testid="user-profile"], .user-profile, .avatar')
    ).toBeVisible({ timeout: 10000 });
    
    console.log('Signed in successfully');
    await page.screenshot({ path: 'after-signout-signin.png' });
    
    // Sign out - with more reliable selector
    try {
      await page.click('[data-testid="user-profile"]');
    } catch (e) {
      console.log('Could not find user profile by data-testid, trying other selectors');
      await page.click('.user-profile, .avatar, [aria-label="User menu"]');
    }
    
    console.log('Clicked user profile');
    
    try {
      await page.click('[data-testid="sign-out-button"]');
    } catch (e) {
      console.log('Could not find sign out button by data-testid, trying other selectors');
      await page.click('button:has-text("Sign out"), button:has-text("Logout")');
    }
    
    console.log('Clicked sign out button');
    
    // Verify user is signed out - with more reliable selector
    await expect(
      page.locator('[data-testid="sign-in-button"], button:has-text("Sign in")')
    ).toBeVisible({ timeout: 10000 });
    
    console.log('Sign out test completed successfully');
  });
});
