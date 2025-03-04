import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

// Get base URL from environment or use default
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('Stripe Connect Flow', () => {
  test('should show connect button for unauthenticated users as disabled', async ({ page }) => {
    // Go to profile page without logging in
    await page.goto(`${baseUrl}/profile`);
    
    // Expect to see a disabled Stripe Connect button
    // First wait for the page to load properly
    await page.waitForLoadState('networkidle');
    
    // Check for the button with more flexible text matching
    const connectButton = page.getByRole('button', { disabled: true }).filter({ hasText: /sign in|log in/i });
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toBeDisabled();
  });

  test('should show connect button for authenticated users', async ({ page }) => {
    // Login first
    await login(page);
    
    // Go to profile page
    await page.goto(`${baseUrl}/profile`);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Expect to see the Stripe Connect button - use a more flexible selector
    const connectButton = page.getByRole('button').filter({ hasText: /connect|stripe/i, disabled: false });
    await expect(connectButton).toBeVisible();
  });

  test('should redirect to Stripe when clicking connect button', async ({ page }) => {
    // Mock the redirect to avoid actually going to Stripe
    await page.route('**/api/stripe/direct-redirect', async (route) => {
      // Instead of redirecting to Stripe, we'll redirect to a test page
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>Mock Stripe Connect Page</h1><p>This simulates the Stripe Connect page</p></body></html>'
      });
    });
    
    // Login first
    await login(page);
    
    // Go to profile page
    await page.goto(`${baseUrl}/profile`);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Click the connect button - use a more flexible selector
    const connectButton = page.getByRole('button').filter({ hasText: /connect|stripe/i, disabled: false });
    await expect(connectButton).toBeVisible();
    
    // Expect a toast to appear
    const toastPromise = page.waitForSelector('[role="status"]', { state: 'attached', timeout: 10000 });
    
    // Click the button
    await connectButton.click();
    
    // Wait for the toast
    await toastPromise;
    
    // Verify toast content
    const toast = page.locator('[role="status"]');
    await expect(toast).toContainText(/connecting|redirecting/i);
  });

  test('should handle successful return from Stripe', async ({ page }) => {
    // Mock the Stripe callback
    await page.route('**/api/stripe/connect/callback**', async (route) => {
      // Simulate a successful callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `${baseUrl}/profile?success=connected`
        }
      });
    });
    
    // Login first
    await login(page);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Directly navigate to the callback URL to simulate return from Stripe
    await page.goto(`${baseUrl}/api/stripe/connect/callback?account_id=acct_test123`);
    
    // Should be redirected to profile with success param
    await expect(page).toHaveURL(new RegExp(`${baseUrl.replace(/\//g, '\\/')}\\/profile\\?success=connected`));
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Expect success message - wait for it to appear
    const successMessage = page.locator('[role="status"]');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('should handle incomplete onboarding return from Stripe', async ({ page }) => {
    // Mock the Stripe callback for incomplete onboarding
    await page.route('**/api/stripe/connect/callback**', async (route) => {
      // Simulate an incomplete onboarding callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `${baseUrl}/profile?status=requirements-needed`
        }
      });
    });
    
    // Login first
    await login(page);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Directly navigate to the callback URL to simulate return from Stripe
    await page.goto(`${baseUrl}/api/stripe/connect/callback?account_id=acct_test123`);
    
    // Should be redirected to profile with status param
    await expect(page).toHaveURL(new RegExp(`${baseUrl.replace(/\//g, '\\/')}\\/profile\\?status=requirements-needed`));
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should handle error return from Stripe', async ({ page }) => {
    // Mock the Stripe callback for error
    await page.route('**/api/stripe/connect/callback**', async (route) => {
      // Simulate an error callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `${baseUrl}/profile?error=account-mismatch`
        }
      });
    });
    
    // Login first
    await login(page);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Directly navigate to the callback URL to simulate return from Stripe
    await page.goto(`${baseUrl}/api/stripe/connect/callback?account_id=acct_invalid`);
    
    // Should be redirected to profile with error param
    await expect(page).toHaveURL(new RegExp(`${baseUrl.replace(/\//g, '\\/')}\\/profile\\?error=account-mismatch`));
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Expect error message - wait for it to appear
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});
