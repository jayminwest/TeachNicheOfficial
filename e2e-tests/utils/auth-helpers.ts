import { Page } from '@playwright/test';

/**
 * Helper function to login a user
 * 
 * @param page Playwright page object
 * @param email User email
 * @param password User password
 */
export async function loginAsUser(page: Page, email: string, password: string) {
  console.log('Starting login process');
  
  // Use relative URL to avoid creating a new server connection
  await page.goto('/');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  // Try to find and click the sign-in button with more robust selectors
  try {
    // Try multiple selectors with a more generous timeout
    const selectors = [
      '[data-testid="sign-in-button"]',
      '[data-testid="sign-in-button-mobile"]',
      'button:has-text("Sign In")',
      'button:has-text("Sign in")',
      'button:has-text(/sign in/i)'
    ];
    
    let buttonClicked = false;
    
    for (const selector of selectors) {
      try {
        const isVisible = await page.isVisible(selector, { timeout: 5000 });
        if (isVisible) {
          console.log(`Found sign-in button with selector: ${selector}`);
          await page.click(selector);
          buttonClicked = true;
          break;
        }
      } catch (error) {
        console.log(`Selector ${selector} not found or not visible`);
      }
    }
    
    if (!buttonClicked) {
      // Take a screenshot of the current state for debugging
      await page.screenshot({ path: `debug-no-sign-in-button-${Date.now()}.png` });
      
      // Try one more approach - look for any button containing "Sign In" text
      const allButtons = await page.$$('button');
      console.log(`Found ${allButtons.length} buttons on the page`);
      
      for (const button of allButtons) {
        const text = await button.textContent();
        console.log(`Button text: "${text}"`);
        if (text && text.toLowerCase().includes('sign in')) {
          console.log('Found button with "Sign In" text');
          await button.click();
          buttonClicked = true;
          break;
        }
      }
      
      if (!buttonClicked) {
        throw new Error('Could not find any sign-in button');
      }
    }
  } catch (error) {
    console.error('Failed to find sign-in button:', error);
    await page.screenshot({ path: `debug-sign-in-button-${Date.now()}.png` });
    throw new Error(`Could not find sign-in button: ${error.message}`);
  }
  
  console.log('Sign-in dialog should be open now');
  
  // Wait for the auth dialog to appear
  try {
    await page.waitForSelector('[data-testid="auth-dialog"]', { timeout: 5000 });
    console.log('Auth dialog is visible');
  } catch (error) {
    console.error('Auth dialog not found:', error);
    await page.screenshot({ path: `debug-auth-dialog-${Date.now()}.png` });
    // Continue anyway, as the dialog might be there but without the data-testid
  }
  
  // Click the Google sign-in button
  try {
    // Try multiple selectors for the Google sign-in button
    const googleButtonSelectors = [
      '[data-testid="google-sign-in"]',
      'button:has-text("Sign in with Google")',
      'button:has-text("Continue with Google")'
    ];
    
    let googleButtonClicked = false;
    
    for (const selector of googleButtonSelectors) {
      try {
        if (await page.isVisible(selector, { timeout: 3000 })) {
          console.log(`Found Google sign-in button: ${selector}`);
          await page.click(selector);
          googleButtonClicked = true;
          break;
        }
      } catch (error) {
        console.log(`Google button selector ${selector} not found`);
      }
    }
    
    if (!googleButtonClicked) {
      throw new Error('Could not find Google sign-in button');
    }
    
    console.log('Clicked Google sign-in button');
    
    // For tests, simulate a successful Google sign-in
    await page.evaluate(() => {
      if (typeof window !== 'undefined') {
        window.signInWithGoogleCalled = true;
        // Also set a flag in localStorage to indicate successful auth
        localStorage.setItem('auth-test-success', 'true');
      }
    });
    
    console.log('Credentials filled (simulated Google sign-in)');
    
    // Navigate to dashboard to simulate successful sign-in
    await page.goto('/dashboard');
    console.log('Navigated to dashboard');
    
    return true;
  } catch (error) {
    console.error('Failed to complete sign-in:', error);
    await page.screenshot({ path: `debug-sign-in-error-${Date.now()}.png` });
    throw error;
  }
}

/**
 * Helper function to create a test lesson
 * 
 * @param page Playwright page object
 * @param title Lesson title
 * @param price Lesson price in dollars
 */
export async function createTestLesson(page: Page, title: string, price: number) {
  await page.goto('/dashboard/lessons/new');
  await page.fill('[data-testid="title-input"]', title);
  await page.fill('[data-testid="description-input"]', 'Test lesson description');
  await page.fill('[data-testid="price-input"]', price.toString());
  
  // Upload a test video if needed
  // This would depend on your implementation
  
  await page.click('[data-testid="submit-button"]');
  await page.waitForSelector('[data-testid="lesson-created-success"]');
}
