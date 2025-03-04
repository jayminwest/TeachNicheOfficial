import { Page } from '@playwright/test';

/**
 * Helper function to log in a user for testing
 */
export async function login(page: Page, email = 'test@example.com', password = 'password123') {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  
  // Go to login page with full URL
  await page.goto(`${baseUrl}/login`);
  
  // Fill in login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL(`${baseUrl}/profile`);
}
