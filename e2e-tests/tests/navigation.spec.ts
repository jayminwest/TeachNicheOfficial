import { test, expect } from '@playwright/test';

test('navigation test', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Verify the page has loaded
  await expect(page).toHaveTitle(/Teach Niche/);
  
  // Test navigation to About page
  await page.getByRole('link', { name: /about/i }).click();
  await expect(page).toHaveURL(/.*about/);
  
  // Test navigation back to home
  await page.getByRole('link', { name: /home/i }).click();
  await expect(page).toHaveURL(/^\/$|^\/\?/);
});
