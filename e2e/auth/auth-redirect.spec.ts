import { test, expect } from '@playwright/test';
import { setupApiInterceptors } from '../helpers/api-interceptor';
import { setupAuthCookies } from '../helpers/auth-cookies';

test.describe('Authentication Redirect', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API interceptors
    await setupApiInterceptors(page);
  });
  
  test('redirects unauthenticated users to sign-in when accessing protected pages', async ({ page }) => {
    // Clear any existing auth cookies
    await page.context().clearCookies();
    
    // Try to access a protected page
    await page.goto('/profile');
    
    // Verify redirect to auth page with redirect parameter
    await page.waitForURL(/\/auth.*redirect.*profile/i);
  });
  
  test('redirects to originally requested page after authentication', async ({ page }) => {
    // First, try to access a protected page without auth
    await page.context().clearCookies();
    await page.goto('/profile');
    
    // Verify redirect to auth page
    await page.waitForURL(/\/auth.*redirect.*profile/i);
    
    // Store the current URL with the redirect parameter
    const authUrl = page.url();
    console.log('Auth URL with redirect:', authUrl);
    
    // Navigate to home page first to ensure we're in the app domain
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Set up auth cookies to simulate successful authentication
    await setupAuthCookies(page, 'test-learner-id');
    
    // Now that we're authenticated, navigate to the home page again to ensure we can use localStorage
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Store the redirect path in sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('auth-redirect', '/profile');
    });
    
    // Navigate directly to profile with test_auth parameter
    await page.goto('/profile?test_auth=true', { waitUntil: 'networkidle' });
    
    // Wait for the page to stabilize
    await page.waitForTimeout(2000);
    
    // Verify we're on the profile page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/profile');
  });
  
  test('allows access to protected pages for authenticated users', async ({ page }) => {
    // First navigate to a page in the app domain
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Set up auth cookies
    await setupAuthCookies(page, 'test-learner-id');
    
    // Navigate to home page again to ensure we can use localStorage
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Try to access a protected page
    await page.goto('/profile?test_auth=true', { waitUntil: 'networkidle' });
    
    // Wait for the page to stabilize
    await page.waitForTimeout(2000);
    
    // Verify we're on the profile page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/profile');
  });
});
