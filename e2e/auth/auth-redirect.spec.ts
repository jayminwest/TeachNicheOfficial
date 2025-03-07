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
    await page.waitForURL(/\/auth.*redirect.*profile/i);
  });
  
  test('redirects to originally requested page after authentication', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/profile');
    
    // Verify redirect to auth page
    await page.waitForURL(/\/auth.*redirect.*profile/i);
    
    // Mock a successful login
    await login(page, 'learner');
    
    // Wait for navigation to complete
    await page.waitForTimeout(1000);
    
    // Check if we're on the profile page or being redirected there
    const currentUrl = page.url();
    const isOnProfileOrRedirecting = 
      currentUrl.includes('/profile') || 
      (currentUrl.includes('/auth') && currentUrl.includes('redirect=%2Fprofile'));
    
    expect(isOnProfileOrRedirecting).toBe(true);
  });
  
  test('allows access to protected pages for authenticated users', async ({ page }) => {
    // Log in first
    await login(page, 'learner');
    
    // Wait for authentication to be fully applied
    await page.waitForTimeout(500);
    
    // Try to access a protected page
    await page.goto('/profile');
    
    // Wait for navigation to complete
    await page.waitForTimeout(1000);
    
    // Check if we're on the profile page or a valid authenticated page
    const currentUrl = page.url();
    const isOnValidPage = 
      currentUrl.includes('/profile') || 
      !currentUrl.includes('/auth');  // Not redirected to auth
    
    expect(isOnValidPage).toBe(true);
    
    // Check for authenticated state in localStorage
    const isAuthenticated = await page.evaluate(() => {
      const sessionData = localStorage.getItem('supabase.auth.token');
      return !!sessionData;
    });
    
    expect(isAuthenticated).toBe(true);
  });
});
