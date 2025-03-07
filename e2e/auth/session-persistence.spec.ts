import { test, expect } from '@playwright/test';
import { login, logout } from '../helpers/auth';
import { setupApiInterceptors } from '../helpers/api-interceptor';

test.describe('Session Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API interceptors
    await setupApiInterceptors(page);
    
    // Start from a clean state
    await logout(page);
    
    // Log in
    await login(page, 'learner');
  });
  
  test('maintains authentication across page navigation', async ({ page }) => {
    // Verify user is logged in on home page
    await page.waitForSelector('text=Test Learner', { timeout: 10000 });
    
    // Navigate to another page
    await page.goto('/lessons');
    
    // Verify user is still logged in
    await page.waitForSelector('text=Test Learner', { timeout: 10000 });
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify user is still logged in and can access protected content
    await page.waitForSelector('text=Test Learner', { timeout: 10000 });
  });
  
  test('maintains authentication after page refresh', async ({ page }) => {
    // Verify user is logged in
    await page.waitForSelector('text=Test Learner', { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    
    // Verify user is still logged in
    await page.waitForSelector('text=Test Learner', { timeout: 10000 });
  });
  
  test('clears session on logout', async ({ page }) => {
    // Verify user is logged in
    await page.waitForSelector('text=Test Learner', { timeout: 10000 });
    
    // Find and click the sign out button (may need to open a menu first)
    // Use a more generic selector since the exact UI structure might vary
    try {
      await page.getByRole('button', { name: /account/i }).click();
      await page.getByRole('button', { name: /sign out/i }).click();
    } catch (e) {
      // Try alternative logout method if the first one fails
      await page.getByRole('button', { name: /logout|sign out/i, exact: false }).click();
    }
    
    // Verify user is logged out
    await expect(page.getByText('Test Learner')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
