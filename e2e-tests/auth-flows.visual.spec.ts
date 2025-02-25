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
    
    // Set up mocking to simulate a failure
    await page.addInitScript(() => {
      // Mock the signInWithGoogle function to return an error
      window.signInWithGoogle = async function() {
        console.log('Mocked signInWithGoogle called with failure');
        
        // Create an error
        const error = new Error('Failed to sign in with Google');
        
        // Return an error response
        return {
          data: { user: null, session: null },
          error
        };
      };
    });
    
    // Open the sign-in dialog
    const signInButton = page.locator('button').filter({ hasText: 'Sign In' }).first();
    await signInButton.click();
    
    // Wait for the dialog to be fully visible
    const authDialog = page.locator('div[role="dialog"]');
    await authDialog.waitFor({ state: 'visible' });
    
    // Find and click the Google sign-in button
    const googleSignInButton = authDialog.locator('button').filter({ 
      hasText: 'Sign in with Google' 
    }).first();
    await googleSignInButton.click();
    
    // Wait for the error message to appear
    const errorMessage = authDialog.locator('.text-red-500');
    await errorMessage.waitFor({ state: 'visible' });
    
    // Take a screenshot of the dialog with error
    await compareScreenshot(page, 'sign-in-error', {
      fullPage: false,
      mask: getMaskSelectors()
    });
  });
});
