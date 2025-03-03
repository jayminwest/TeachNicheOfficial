import { test, expect } from '@playwright/test';

/**
 * Basic test to verify Playwright is working correctly
 * This test doesn't require the application to be running
 */
test('basic test', async ({ page }) => {
  // Create a simple HTML page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Basic Test</title>
      </head>
      <body>
        <h1>Hello, Playwright!</h1>
        <p>This is a basic test to verify that Playwright is working correctly.</p>
        <button id="test-button">Click Me</button>
        <div id="result"></div>
        
        <script>
          document.getElementById('test-button').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Button clicked!';
          });
        </script>
      </body>
    </html>
  `);
  
  // Verify the page title
  await expect(page).toHaveTitle('Basic Test');
  
  // Verify the heading
  const heading = page.locator('h1');
  await expect(heading).toHaveText('Hello, Playwright!');
  
  // Interact with the page
  await page.click('#test-button');
  
  // Verify the result
  const result = page.locator('#result');
  await expect(result).toHaveText('Button clicked!');
});
