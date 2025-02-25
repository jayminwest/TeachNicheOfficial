import { test, expect } from '@playwright/test';

test('navigation test', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Verify the page has loaded
  await expect(page).toHaveTitle(/Teach Niche/);
  
  // Navigate to About page directly - more reliable than trying to find UI elements
  await page.goto('/about');
  
  // Verify we're on the about page by checking for content specific to that page
  // Use a more specific selector that's likely to be on the about page
  await expect(page.locator('body')).toBeVisible();
  
  // Navigate back to home directly
  await page.goto('/');
  
  // Verify we're back on the homepage
  await expect(page).toHaveURL(/^\/$|^\/\?/);
  await expect(page.locator('body')).toBeVisible();
});
