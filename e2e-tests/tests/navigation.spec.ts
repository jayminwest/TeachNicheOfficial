import { test, expect } from '@playwright/test';

test('navigation test', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');
  
  // Verify the page has loaded
  await expect(page).toHaveTitle(/Teach Niche/);
  
  // Test navigation to About page
  // Instead of looking for a link with text "about", look for a button with text "About"
  await page.getByRole('button', { name: 'About' }).click({ force: true });
  await expect(page).toHaveURL(/.*about/);
  
  // Test navigation back to home
  // Instead of looking for a button with text "home", look for a button with text "Home"
  await page.getByRole('button', { name: 'Home' }).click({ force: true });
  await expect(page).toHaveURL(/^\/$|^\/\?/);
});
