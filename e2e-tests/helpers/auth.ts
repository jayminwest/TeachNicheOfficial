import { Page } from '@playwright/test';

/**
 * Helper function to log in a user
 * @param page Playwright page object
 * @param email User email
 * @param password User password
 */
export async function login(page: Page, email: string = 'test-user@example.com', password: string = 'TestPassword123!') {
  await page.goto('/');
  
  // Check if already logged in by looking for profile button
  const isLoggedIn = await page.locator('[data-testid="profile-button"]').count() > 0;
  if (isLoggedIn) {
    return;
  }
  
  // Click sign in button
  await page.click('[data-testid="sign-in-button"]');
  
  // Wait for auth dialog to appear
  await page.waitForSelector('[data-testid="auth-dialog"]');
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  
  // Submit form
  await page.click('[data-testid="submit-sign-in"]');
  
  // Wait for profile button to appear, indicating successful login
  await page.waitForSelector('[data-testid="profile-button"]', { timeout: 5000 });
}

/**
 * Helper function to log out a user
 * @param page Playwright page object
 */
export async function logout(page: Page) {
  // Check if logged in
  const isLoggedIn = await page.locator('[data-testid="profile-button"]').count() > 0;
  if (!isLoggedIn) {
    return;
  }
  
  // Click profile button
  await page.click('[data-testid="profile-button"]');
  
  // Click logout button in dropdown
  await page.click('[data-testid="logout-button"]');
  
  // Wait for sign in button to appear, indicating successful logout
  await page.waitForSelector('[data-testid="sign-in-button"]', { timeout: 5000 });
}
