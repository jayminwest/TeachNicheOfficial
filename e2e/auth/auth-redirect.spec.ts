import { test, expect } from '@playwright/test';
import { login, logout } from '../helpers/auth';
import { setupApiInterceptors } from '../helpers/api-interceptor';

test.describe('Authentication Redirect', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API interceptors
    await setupApiInterceptors(page);
    
    // Start from a clean state
    await logout(page);
  });
  
  test('redirects unauthenticated users to sign-in when accessing protected pages', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/profile');
    
    // Verify redirect to auth page with redirect parameter
    await expect(page).toHaveURL(/\/auth\?redirect=%2Fprofile/);
  });
  
  test('redirects to originally requested page after authentication', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/profile');
    
    // Verify redirect to auth page
    await expect(page).toHaveURL(/\/auth\?redirect=%2Fprofile/);
    
    // Mock a successful login
    await login(page, 'learner');
    
    // Verify redirect back to the originally requested page
    await expect(page).toHaveURL('/profile');
  });
  
  test('allows access to protected pages for authenticated users', async ({ page }) => {
    // Log in first
    await login(page, 'learner');
    
    // Try to access a protected page
    await page.goto('/profile');
    
    // Verify no redirect occurs
    await expect(page).toHaveURL('/profile');
    
    // Verify profile content is visible
    await expect(page.getByText('Test Learner')).toBeVisible();
  });
});
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Authentication Redirect', () => {
  test('redirects unauthenticated users to sign-in', async ({ page }) => {
    // Try to access a protected page without being logged in
    await page.goto('/profile');
    
    // Verify we're redirected to the auth page
    await expect(page).toHaveURL(/\/auth\?redirect=/);
    
    // Verify the redirect parameter contains the original URL
    const url = page.url();
    expect(url).toContain('redirect=%2Fprofile');
  });
  
  test('redirects to requested page after authentication', async ({ page }) => {
    // Go to a protected page, which should redirect to login
    await page.goto('/profile');
    
    // Verify redirect to auth page
    await expect(page).toHaveURL(/\/auth\?redirect=/);
    
    // Now login
    await login(page, 'user@example.com');
    
    // Verify we're redirected back to the originally requested page
    await expect(page).toHaveURL('/profile');
  });
  
  test('respects custom redirect parameter', async ({ page }) => {
    // Go directly to auth with custom redirect
    await page.goto('/auth?redirect=%2Flessons');
    
    // Login
    await login(page, 'user@example.com');
    
    // Verify we're redirected to the specified page
    await expect(page).toHaveURL('/lessons');
  });
});
