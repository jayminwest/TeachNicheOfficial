import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Stripe Connect Flow', () => {
  test('should show connect button for unauthenticated users as disabled', async ({ page }) => {
    // Go to profile page without logging in
    await page.goto('/profile');
    
    // Expect to see a disabled Stripe Connect button
    const connectButton = page.getByRole('button', { name: /please sign in to connect stripe/i });
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toBeDisabled();
  });

  test('should show connect button for authenticated users', async ({ page }) => {
    // Login first
    await login(page);
    
    // Go to profile page
    await page.goto('/profile');
    
    // Expect to see the Stripe Connect button
    const connectButton = page.getByRole('button', { name: /connect with stripe|connected to stripe|continue stripe setup/i });
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
    await page.goto('/profile');
    
    // Click the connect button
    const connectButton = page.getByRole('button', { name: /connect with stripe/i });
    
    // Expect a toast to appear
    const toastPromise = page.waitForSelector('[role="status"]', { state: 'attached' });
    
    // Click the button
    await connectButton.click();
    
    // Wait for the toast
    await toastPromise;
    
    // Verify toast content
    const toast = page.locator('[role="status"]');
    await expect(toast).toContainText(/connecting to stripe/i);
  });

  test('should handle successful return from Stripe', async ({ page }) => {
    // Mock the Stripe callback
    await page.route('**/api/stripe/connect/callback**', async (route) => {
      // Simulate a successful callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/profile?success=connected'
        }
      });
    });
    
    // Login first
    await login(page);
    
    // Directly navigate to the callback URL to simulate return from Stripe
    await page.goto('/api/stripe/connect/callback?account_id=acct_test123');
    
    // Should be redirected to profile with success param
    await expect(page).toHaveURL(/profile\?success=connected/);
    
    // Expect success message
    const successMessage = page.locator('[role="status"]');
    await expect(successMessage).toBeVisible();
  });

  test('should handle incomplete onboarding return from Stripe', async ({ page }) => {
    // Mock the Stripe callback for incomplete onboarding
    await page.route('**/api/stripe/connect/callback**', async (route) => {
      // Simulate an incomplete onboarding callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/profile?status=requirements-needed'
        }
      });
    });
    
    // Login first
    await login(page);
    
    // Directly navigate to the callback URL to simulate return from Stripe
    await page.goto('/api/stripe/connect/callback?account_id=acct_test123');
    
    // Should be redirected to profile with status param
    await expect(page).toHaveURL(/profile\?status=requirements-needed/);
  });

  test('should handle error return from Stripe', async ({ page }) => {
    // Mock the Stripe callback for error
    await page.route('**/api/stripe/connect/callback**', async (route) => {
      // Simulate an error callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/profile?error=account-mismatch'
        }
      });
    });
    
    // Login first
    await login(page);
    
    // Directly navigate to the callback URL to simulate return from Stripe
    await page.goto('/api/stripe/connect/callback?account_id=acct_invalid');
    
    // Should be redirected to profile with error param
    await expect(page).toHaveURL(/profile\?error=account-mismatch/);
    
    // Expect error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });
});
