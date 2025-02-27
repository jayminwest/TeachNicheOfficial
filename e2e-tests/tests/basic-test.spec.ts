import { test, expect } from '@playwright/test';

test('basic test without server dependency', async ({ page }) => {
  // Create a simple HTML page directly in the test
  await page.setContent(`
    <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Hello Playwright</h1>
        <button>Click me</button>
      </body>
    </html>
  `);
  
  // Verify the content
  await expect(page.locator('h1')).toHaveText('Hello Playwright');
  await expect(page.locator('button')).toBeVisible();
});
