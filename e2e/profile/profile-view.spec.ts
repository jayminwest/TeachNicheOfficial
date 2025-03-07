import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { setupApiInterceptors } from '../helpers/api-interceptor';
import { mockStripeConnectAccount } from '../helpers/stripe';

test.describe('Profile View', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API interceptors
    await setupApiInterceptors(page);
  });
  
  test('redirects to sign in when not authenticated', async ({ page }) => {
    // Go to profile page without authentication
    await page.goto('/profile');
    
    // Verify redirect to auth page
    await expect(page).toHaveURL(/\/auth\?redirect=%2Fprofile/);
  });
  
  test('displays learner profile information correctly', async ({ page }) => {
    // Log in as a learner
    await login(page, 'learner');
    
    // Go to profile page
    await page.goto('/profile');
    
    // Verify profile elements
    await expect(page.getByText('Test Learner')).toBeVisible();
    await expect(page.getByText('learner@example.com')).toBeVisible();
    
    // Verify purchased lessons section is visible
    await expect(page.getByText(/Purchased Lessons/i)).toBeVisible();
    
    // Verify creator-specific elements are not visible
    await expect(page.getByText(/Creator Dashboard/i)).not.toBeVisible();
    await expect(page.getByText(/Connect with Stripe/i)).not.toBeVisible();
  });
  
  test('displays creator profile with Stripe connection status', async ({ page }) => {
    // Log in as a creator
    await login(page, 'creator');
    
    // Mock Stripe Connect account
    await mockStripeConnectAccount(page, 'complete');
    
    // Go to profile page
    await page.goto('/profile');
    
    // Verify profile elements
    await expect(page.getByText('Test Creator')).toBeVisible();
    await expect(page.getByText('creator@example.com')).toBeVisible();
    
    // Verify creator-specific elements
    await expect(page.getByText(/Creator Dashboard/i)).toBeVisible();
    
    // Verify Stripe connection status
    await expect(page.getByText(/Stripe account connected/i)).toBeVisible();
  });
  
  test('shows Stripe Connect button for creators without connected account', async ({ page }) => {
    // Log in as a creator without Stripe account
    await login(page, 'creator', { stripeAccountId: null });
    
    // Go to profile page
    await page.goto('/profile');
    
    // Verify Stripe Connect button is visible
    await expect(page.getByRole('button', { name: /Connect with Stripe/i })).toBeVisible();
  });
});
