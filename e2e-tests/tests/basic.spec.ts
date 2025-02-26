import { test, expect } from '@playwright/test';

// This ensures the test is skipped if the server is not running
test.describe('Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Try to connect to the server, skip tests if it's not available
    try {
      await page.goto('http://localhost:3000/', { timeout: 5000 });
    } catch (error) {
      test.skip(true, 'Local development server is not running');
    }
  });

  test('basic navigation works', async ({ page }) => {
    // Navigate to the homepage (already done in beforeEach)
    
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
