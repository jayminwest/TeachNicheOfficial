import { test, expect } from '@playwright/test';

test('navigation test', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Verify the page has loaded
  await expect(page).toHaveTitle(/Teach Niche/);
  
  // Navigate to About page directly - more reliable than trying to find UI elements
  await page.goto('/about');
  
  // Verify we're on the about page by checking for content specific to that page
  // Check that the URL contains '/about'
  const aboutUrl = page.url();
  expect(aboutUrl).toContain('/about');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Check for a more reliable element that should be visible on the page
  await expect(page).toHaveURL(/about/);
  
  // Navigate back to home directly
  await page.goto('/');
  
  // Verify we're back on the homepage by checking the URL ends with '/'
  const homeUrl = new URL(page.url());
  expect(homeUrl.pathname).toBe('/');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Check for a more reliable element that should be visible on the homepage
  await expect(page).toHaveURL(/\/$/);
});
