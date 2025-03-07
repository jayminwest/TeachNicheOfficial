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
    await expect(page.getByText('Test Learner')).toBeVisible();
    
    // Navigate to another page
    await page.goto('/lessons');
    
    // Verify user is still logged in
    await expect(page.getByText('Test Learner')).toBeVisible();
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify user is still logged in and can access protected content
    await expect(page.getByText('Test Learner')).toBeVisible();
  });
  
  test('maintains authentication after page refresh', async ({ page }) => {
    // Verify user is logged in
    await expect(page.getByText('Test Learner')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Verify user is still logged in
    await expect(page.getByText('Test Learner')).toBeVisible();
  });
  
  test('clears session on logout', async ({ page }) => {
    // Verify user is logged in
    await expect(page.getByText('Test Learner')).toBeVisible();
    
    // Find and click the sign out button (may need to open a menu first)
    await page.getByRole('button', { name: /account/i }).click();
    await page.getByRole('button', { name: /sign out/i }).click();
    
    // Verify user is logged out
    await expect(page.getByText('Test Learner')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Session Persistence', () => {
  test('maintains authentication across page navigation', async ({ page }) => {
    // Login
    await login(page, 'user@example.com');
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify we're logged in
    await expect(page.locator('[data-testid="profile-container"]')).toBeVisible();
    
    // Navigate to another page
    await page.goto('/');
    
    // Navigate back to a protected page
    await page.goto('/profile');
    
    // Verify we're still logged in (no redirect to auth)
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('[data-testid="profile-container"]')).toBeVisible();
  });
  
  test('maintains authentication after page refresh', async ({ page }) => {
    // Login
    await login(page, 'user@example.com');
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify we're logged in
    await expect(page.locator('[data-testid="profile-container"]')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Verify we're still logged in
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('[data-testid="profile-container"]')).toBeVisible();
  });
});
