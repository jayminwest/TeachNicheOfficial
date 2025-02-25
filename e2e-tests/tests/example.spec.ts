import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Verify the page has loaded by checking for a common element
  await expect(page).toHaveTitle(/Teach Niche/);
});
