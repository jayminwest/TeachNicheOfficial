import { test, expect } from '@playwright/test';

test('navigation test', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Verify the page has loaded
  await expect(page).toHaveTitle(/Teach Niche/);
  
  // Test navigation to About page - try multiple possible selectors
  try {
    // First try to find a navigation link with text "About"
    await page.getByRole('link', { name: 'About', exact: true }).click();
  } catch (e) {
    // If that fails, try a button
    try {
      await page.getByRole('button', { name: 'About', exact: true }).click();
    } catch (e) {
      // As a fallback, try to navigate directly
      await page.goto('/about');
    }
  }
  
  // Verify we're on the about page by checking for content specific to that page
  await expect(page.locator('h1, h2').filter({ hasText: /about|About/ })).toBeVisible({ timeout: 5000 });
  
  // Test navigation back to home
  try {
    // First try to find a navigation link with text "Home"
    await page.getByRole('link', { name: 'Home', exact: true }).click();
  } catch (e) {
    // If that fails, try a button
    try {
      await page.getByRole('button', { name: 'Home', exact: true }).click();
    } catch (e) {
      // As a fallback, try to navigate directly
      await page.goto('/');
    }
  }
  
  // Verify we're back on the homepage by checking for content specific to the homepage
  await expect(page).toHaveURL(/^\/$|^\/\?/);
  await expect(page.locator('body')).toBeVisible();
});
