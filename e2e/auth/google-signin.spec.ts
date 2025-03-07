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
    await expect(page.locator('h1')).toContainText('Sign In');
    
    // Verify the Google sign-in button is present
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();
    
    // Verify the email sign-in form is present
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });
  
  test('handles successful sign-in', async ({ page }) => {
    // Mock a successful login
    await login(page, 'learner');
    
    // Verify redirect to home page
    await expect(page).toHaveURL('/');
    
    // Verify user is logged in (check for profile elements in the UI)
    await expect(page.getByText('Test Learner')).toBeVisible();
  });
  
  test('handles authentication errors', async ({ page }) => {
    // Try to sign in with invalid credentials
    await page.getByLabel(/Email/i).fill('invalid@example.com');
    await page.getByLabel(/Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    // Verify error message
    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible();
  });
  
  test('redirects to requested page after login', async ({ page }) => {
    // Go to auth page with redirect parameter
    await page.goto('/auth?redirect=/lessons');
    
    // Mock a successful login
    await login(page, 'learner');
    
    // Verify redirect to the specified page
    await expect(page).toHaveURL('/lessons');
  });
});
