// Global setup file for Playwright tests
import { chromium } from '@playwright/test';

/**
 * This setup runs before all tests
 */
export default async function globalSetup() {
  // Set up any global test environment needs here
  console.log('Setting up Playwright test environment...');
  
  try {
    // Create a browser instance to verify everything is working
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Basic verification that browser launches correctly
    await page.goto('about:blank');
    console.log('Browser launched successfully');
    
    // You could set up authentication state here
    // await page.goto('http://localhost:3000');
    // await page.fill('[data-testid="email-input"]', 'test@example.com');
    // await page.fill('[data-testid="password-input"]', 'password123');
    // await page.click('[data-testid="login-button"]');
    // await page.context().storageState({ path: 'e2e-tests/setup/storageState.json' });
    
    await browser.close();
  } catch (error) {
    console.error('Error during Playwright setup:', error);
    // Don't fail the setup, let the tests run and potentially fail
  }
  
  console.log('Playwright test environment setup complete');
}
