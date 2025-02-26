import { test, expect } from '@playwright/test';

test.describe('Basic Tests', () => {
  test('basic navigation works', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Verify the page title
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Verify some basic content is present
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});
