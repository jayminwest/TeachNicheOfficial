import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies();
  });

  test('redirects to sign in when accessing protected content', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await expect(page).toHaveURL(/.*\/auth.*/);
    
    // Should show sign in form
    await expect(page.getByText('Sign in to Teach Niche')).toBeVisible();
  });

  test('shows error message for authentication failures', async ({ page }) => {
    // Go to auth page with error parameter
    await page.goto('/auth?error=OAuthSignin');
    
    // Should show error message
    await expect(page.getByText('There was a problem signing you in')).toBeVisible();
    
    // Error alert should be visible
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('problem signing you in');
  });

  test('redirects after successful authentication', async ({ page, context }) => {
    // Set up route interception for auth endpoints
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
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
    
    // Also intercept session endpoint
    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            access_token: 'mock-token',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            }
          }
        }),
      });
    });
    
    // Set up cookies to simulate authenticated state
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: new URL(page.url()).hostname,
        path: '/',
      },
      {
        name: 'sb-refresh-token',
        value: 'mock-refresh-token',
        domain: new URL(page.url()).hostname,
        path: '/',
      }
    ]);
    
    // Go to auth page with redirect parameter
    await page.goto('/auth?redirect=/lessons');
    
    // Click sign in button (assuming Google auth)
    const signInButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Should eventually redirect to lessons page after auth
    // This may take some time as it involves multiple redirects
    await expect(page).toHaveURL('/lessons', { timeout: 10000 });
  });
  
  test('handles sign out correctly', async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: new URL('http://localhost:3000').hostname,
        path: '/',
      }
    ]);
    
    // Intercept auth endpoints
    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            access_token: 'mock-token',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            }
          }
        }),
      });
    });
    
    // Intercept sign out endpoint
    await page.route('**/auth/v1/logout*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
    
    // Go to a page with sign out button
    await page.goto('/profile');
    
    // Wait for page to load and auth state to be determined
    await page.waitForLoadState('networkidle');
    
    // Click sign out button
    const signOutButton = page.getByRole('button', { name: /Sign out/i });
    await expect(signOutButton).toBeVisible({ timeout: 5000 });
    await signOutButton.click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/', { timeout: 5000 });
    
    // Should show sign in option in header
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });
  
  test('preserves authentication across navigation', async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token',
        domain: new URL('http://localhost:3000').hostname,
        path: '/',
      }
    ]);
    
    // Intercept auth endpoints
    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            access_token: 'mock-token',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            }
          }
        }),
      });
    });
    
    // Go to home page
    await page.goto('/');
    
    // Wait for page to load and auth state to be determined
    await page.waitForLoadState('networkidle');
    
    // Should show authenticated state
    const userMenuButton = page.getByTestId('user-menu-button');
    await expect(userMenuButton).toBeVisible({ timeout: 5000 });
    
    // Navigate to another page
    const lessonsLink = page.getByRole('link', { name: /Lessons/i });
    await expect(lessonsLink).toBeVisible();
    await lessonsLink.click();
    
    // Wait for navigation to complete
    await page.waitForURL(/.*\/lessons.*/);
    
    // Should maintain authenticated state
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });
  
  test('handles authentication timeout gracefully', async ({ page }) => {
    // Simulate a slow auth response
    await page.route('**/auth/v1/session*', async (route) => {
      // Delay the response to trigger timeout
      await new Promise(resolve => setTimeout(resolve, 11000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ session: null }),
      });
    });
    
    // Go to a page that requires authentication check
    await page.goto('/');
    
    // Page should still be usable after timeout
    // The auth state should default to unauthenticated
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible({ timeout: 15000 });
    
    // No error messages should be visible to the user
    const errorElements = await page.getByRole('alert').all();
    expect(errorElements.length).toBe(0);
  });
});
