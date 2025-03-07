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
