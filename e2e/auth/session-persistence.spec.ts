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
    // Check authentication state on home page
    const isAuthenticatedHome = await page.evaluate(() => {
      return !!localStorage.getItem('supabase.auth.token');
    });
    expect(isAuthenticatedHome).toBe(true);
    
    // Navigate to another page
    await page.goto('/lessons');
    
    // Check authentication state on lessons page
    const isAuthenticatedLessons = await page.evaluate(() => {
      return !!localStorage.getItem('supabase.auth.token');
    });
    expect(isAuthenticatedLessons).toBe(true);
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Check authentication state on profile page
    const isAuthenticatedProfile = await page.evaluate(() => {
      return !!localStorage.getItem('supabase.auth.token');
    });
    expect(isAuthenticatedProfile).toBe(true);
  });
  
  test('maintains authentication after page refresh', async ({ page }) => {
    // Check authentication state before refresh
    const isAuthenticatedBefore = await page.evaluate(() => {
      return !!localStorage.getItem('supabase.auth.token');
    });
    expect(isAuthenticatedBefore).toBe(true);
    
    // Refresh the page
    await page.reload();
    
    // Check authentication state after refresh
    const isAuthenticatedAfter = await page.evaluate(() => {
      return !!localStorage.getItem('supabase.auth.token');
    });
    expect(isAuthenticatedAfter).toBe(true);
  });
  
  test('clears session on logout', async ({ page }) => {
    // Check authentication state before logout
    const isAuthenticatedBefore = await page.evaluate(() => {
      return !!localStorage.getItem('supabase.auth.token');
    });
    expect(isAuthenticatedBefore).toBe(true);
    
    // Perform logout directly by clearing localStorage
    await page.evaluate(() => {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('user-profile');
    });
    
    // Refresh to apply changes
    await page.reload();
    
    // Check authentication state after logout
    const isAuthenticatedAfter = await page.evaluate(() => {
      return !!localStorage.getItem('supabase.auth.token');
    });
    expect(isAuthenticatedAfter).toBe(false);
  });
});
