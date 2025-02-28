import { FullConfig, chromium } from '@playwright/test';

/**
 * Global setup file for Playwright tests
 * This runs once before all tests
 */
export default async function globalSetup(config: FullConfig) {
  console.log('Starting global test setup...');
  
  // Ensure environment variables are set
  process.env.PLAYWRIGHT_TEST_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  
  // Log configuration for debugging
  console.log(`Using test base URL: ${process.env.PLAYWRIGHT_TEST_BASE_URL}`);
  console.log(`Test directory: ${config.testDir}`);
  console.log(`Projects: ${config.projects.map(p => p.name).join(', ')}`);
  
  try {
    // Create a browser instance to verify everything is working
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Basic verification that browser launches correctly
    await page.goto('about:blank');
    console.log('Browser launched successfully');
    
    // You could set up authentication state here if needed
    // await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL);
    // await page.fill('[data-testid="email-input"]', 'test@example.com');
    // await page.fill('[data-testid="password-input"]', 'password123');
    // await page.click('[data-testid="login-button"]');
    // await page.context().storageState({ path: 'e2e-tests/setup/storageState.json' });
    
    await browser.close();
  } catch (error) {
    console.error('Error during Playwright setup:', error);
    // Don't fail the setup, let the tests run and potentially fail
  }
  
  console.log('Global test setup complete');
}
