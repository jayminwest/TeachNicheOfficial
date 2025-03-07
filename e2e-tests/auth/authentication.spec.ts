import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects to sign in when accessing protected content', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await expect(page).toHaveURL(/.*\/auth.*/);
    
    // Should show sign in form
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('shows error message for authentication failures', async ({ page }) => {
    // Go to auth page with error parameter
    await page.goto('/auth?error=OAuthSignin');
    
    // Should show error message
    await expect(page.getByText('There was a problem signing you in')).toBeVisible();
  });

  test('redirects after successful authentication', async ({ page }) => {
    // Mock successful authentication
    // Note: This requires setting up auth mocking in your Playwright config
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        }),
      });
    });
    
    // Go to auth page with redirect parameter
    await page.goto('/auth?redirect=/lessons');
    
    // Click sign in button (assuming Google auth)
    await page.getByRole('button', { name: /Sign in with Google/i }).click();
    
    // Should redirect to lessons page after auth
    await expect(page).toHaveURL('/lessons');
  });
  
  test('handles sign out correctly', async ({ page }) => {
    // Set up authenticated session
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Go to a page with sign out button
    await page.goto('/profile');
    
    // Click sign out button
    await page.getByRole('button', { name: /Sign out/i }).click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Should show sign in option in header
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });
  
  test('preserves authentication across navigation', async ({ page }) => {
    // Set up authenticated session
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Go to home page
    await page.goto('/');
    
    // Should show authenticated state
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
    
    // Navigate to another page
    await page.getByRole('link', { name: /Lessons/i }).click();
    
    // Should maintain authenticated state
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });
});
