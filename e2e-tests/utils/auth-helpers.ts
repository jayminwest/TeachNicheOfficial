import { Page } from '@playwright/test';

/**
 * Helper function to login a user
 * 
 * @param page Playwright page object
 * @param email User email
 * @param password User password
 */
export async function loginAsUser(page: Page, email: string, password: string) {
  // Use absolute URL to avoid protocol errors
  await page.goto('http://localhost:3000/');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Click the sign-in button
  await page.click('[data-testid="sign-in-button"]');
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="submit-sign-in"]');
  
  // Wait for authentication to complete
  await page.waitForSelector('[data-testid="user-avatar"]', { timeout: 10000 });
}

/**
 * Helper function to create a test lesson
 * 
 * @param page Playwright page object
 * @param title Lesson title
 * @param price Lesson price in dollars
 */
export async function createTestLesson(page: Page, title: string, price: number) {
  await page.goto('/dashboard/lessons/new');
  await page.fill('[data-testid="title-input"]', title);
  await page.fill('[data-testid="description-input"]', 'Test lesson description');
  await page.fill('[data-testid="price-input"]', price.toString());
  
  // Upload a test video if needed
  // This would depend on your implementation
  
  await page.click('[data-testid="submit-button"]');
  await page.waitForSelector('[data-testid="lesson-created-success"]');
}
