import { Page } from '@playwright/test';

/**
 * Helper function to log in a user for testing
 */
export async function login(page: Page, email = 'test@example.com', password = 'password123') {
  // Go to login page
  await page.goto('/login');
  
  // Fill in login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL('**/profile');
}
