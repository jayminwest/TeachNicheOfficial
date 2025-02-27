import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('/');
  
  // Basic assertion to check that the page loads
  expect(await page.title()).toBeTruthy();
});
