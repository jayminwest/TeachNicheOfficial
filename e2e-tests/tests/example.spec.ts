import { test, expect } from '@playwright/test';

// Basic test to verify the home page loads
test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page title contains the expected text
  await expect(page).toHaveTitle(/Teach Niche/);
  
  // Check that the main heading is visible
  const heading = page.locator('text=Teach Niche');
  await expect(heading).toBeVisible();
});

// Test navigation to the about page
test('can navigate to about page', async ({ page }) => {
  await page.goto('/');
  
  // Click on the About link in the navigation
  await page.click('text=About');
  
  // Verify we're on the about page
  await expect(page).toHaveURL(/.*about/);
});
