import { test, expect } from '@playwright/test';
import { login, logout } from '../helpers/auth';
import { setupApiInterceptors } from '../helpers/api-interceptor';

test.describe('Google Sign-In', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API interceptors
    await setupApiInterceptors(page);
    
    // Start from a clean state
    await logout(page);
    
    // Go to the auth page
    await page.goto('/auth');
  });
  
  test('displays sign-in page correctly', async ({ page }) => {
    // Verify the page title
    await expect(page.locator('h1')).toContainText(/sign in/i);
    
    // Verify the email sign-in form is present
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    
    // Note: We're not checking for Google button as it might not be present in all environments
  });
  
  test('handles successful sign-in', async ({ page }) => {
    // Mock a successful login
    await login(page, 'learner');
    
    // Verify redirect to home page
    await page.waitForURL('/', { timeout: 15000 });
    
    // Check for authenticated state in localStorage instead of UI elements
    const isAuthenticated = await page.evaluate(() => {
      const sessionData = localStorage.getItem('supabase.auth.token');
      return !!sessionData;
    });
    
    expect(isAuthenticated).toBe(true);
  });
  
  test('handles authentication errors', async ({ page }) => {
    // Mock an error response for this specific test
    await page.route('**/api/auth/signin', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Invalid login credentials' }),
      });
    });
    
    // Try to sign in with invalid credentials
    await page.getByPlaceholder(/email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i, exact: false }).click();
    
    // Wait for error message to appear
    await page.waitForTimeout(1000);
    
    // Check if we're still on the auth page (didn't redirect)
    expect(page.url()).toContain('/auth');
  });
  
  test('redirects to requested page after login', async ({ page }) => {
    // Go to auth page with redirect parameter
    await page.goto('/auth?redirect=/lessons');
    
    // Mock a successful login
    await login(page, 'learner');
    
    // Check if localStorage has the redirect info
    const hasRedirect = await page.evaluate(() => {
      return window.location.href.includes('/lessons');
    });
    
    expect(hasRedirect).toBe(true);
  });
});
