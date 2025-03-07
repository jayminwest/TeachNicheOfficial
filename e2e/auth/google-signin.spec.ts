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
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Google Sign-In', () => {
  test('displays sign-in page correctly', async ({ page }) => {
    // Navigate to the auth page
    await page.goto('/auth');
    
    // Verify the page title
    await expect(page.locator('h1')).toContainText('Sign In');
    
    // Verify the Google sign-in button is visible
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();
  });
  
  test('handles successful sign-in', async ({ page }) => {
    // Mock successful Google auth by using our helper
    // This simulates what happens after Google auth completes
    await login(page, 'user@example.com');
    
    // Navigate to a page that requires auth
    await page.goto('/profile');
    
    // Verify we're logged in by checking for profile elements
    // This assumes the profile page shows user info when logged in
    await expect(page.locator('[data-testid="profile-container"]')).toBeVisible();
  });
  
  test('handles authentication errors', async ({ page }) => {
    // Navigate to auth page with error parameter
    await page.goto('/auth?error=OAuthSignin');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText('There was a problem signing in');
    
    // Verify sign-in button is still available
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();
  });
});
