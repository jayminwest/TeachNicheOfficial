import { test } from '@playwright/test';
import { compareScreenshot, getMaskSelectors } from './visual-testing';

// Visual tests for authentication flows
test.describe('Authentication UI', () => {
  test('Sign in dialog appearance', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Open the sign-in dialog
    const signInButton = page.locator('button').filter({ hasText: 'Sign In' }).first();
    await signInButton.click();
    
    // Wait for the dialog to be fully visible
    const authDialog = page.locator('div[role="dialog"]');
    await authDialog.waitFor({ state: 'visible' });
    
    // Take a screenshot of the dialog
    await compareScreenshot(page, 'sign-in-dialog', {
      fullPage: false,
      mask: getMaskSelectors()
    });
  });

  test('Sign up dialog appearance', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Open the sign-in dialog
    const signInButton = page.locator('button').filter({ hasText: 'Sign In' }).first();
    await signInButton.click();
    
    // Wait for the dialog to be fully visible
    const authDialog = page.locator('div[role="dialog"]');
    await authDialog.waitFor({ state: 'visible' });
    
    // Switch to sign up view
    const switchToSignUpLink = authDialog.locator('button').filter({ 
      hasText: "Don't have an account? Sign up" 
    });
    await switchToSignUpLink.click();
    
    // Wait for the transition to complete
    await page.waitForTimeout(300);
    
    // Take a screenshot of the sign up dialog
    await compareScreenshot(page, 'sign-up-dialog', {
      fullPage: false,
      mask: getMaskSelectors()
    });
  });

  test('Authentication error appearance', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Open the sign-in dialog
    const signInButton = page.locator('button').filter({ hasText: 'Sign In' }).first();
    await signInButton.click();
    
    // Wait for the dialog to be fully visible
    const authDialog = page.locator('div[role="dialog"]');
    await authDialog.waitFor({ state: 'visible' });
    
    // Fill in invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit the form
    await page.click('[data-testid="submit-sign-in"]');
    
    // Wait a moment for the error to appear (no need to wait for a specific element)
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the dialog with potential error
    await compareScreenshot(page, 'sign-in-error', {
      fullPage: false,
      mask: getMaskSelectors()
    });
  });
});
