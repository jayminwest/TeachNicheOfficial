import { test, expect } from '@playwright/test';

// Basic test to verify the home page loads
test('home page loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page title contains the expected text
  await expect(page).toHaveTitle(/Teach Niche/);
  
  // Check that the main heading is visible - use a more specific selector
  const heading = page.getByRole('heading', { name: /Teach Niche/i }).first();
  await expect(heading).toBeVisible();
});

// Test navigation to the about page
test('can navigate to about page', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to the about page directly
  await page.goto('/about');
  
  // Verify we're on the about page
  await expect(page).toHaveURL(/.*about/);
  
  // Verify the about page content is visible
  const aboutHeading = page.getByRole('heading').first();
  await expect(aboutHeading).toBeVisible();
});
