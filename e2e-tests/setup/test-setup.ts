import { FullConfig, chromium, BrowserContext, Browser, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup file for Playwright tests
 * This runs once before all tests
 */
export default async function globalSetup(config: FullConfig) {
  console.log('Starting global test setup...');
  
  // Ensure environment variables are set
  process.env.PLAYWRIGHT_TEST_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  
  // Create a directory for test screenshots if it doesn't exist
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  // Log configuration for debugging
  console.log(`Using test base URL: ${process.env.PLAYWRIGHT_TEST_BASE_URL}`);
  console.log(`Test directory: ${config.testDir}`);
  console.log(`Projects: ${config.projects.map(p => p.name).join(', ')}`);
  console.log(`Screenshot directory: ${screenshotDir}`);
  
  try {
    // Create a browser instance to verify everything is working
    const browser: Browser = await chromium.launch();
    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();
    
    // Add test-specific properties to the browser context
    await context.addInitScript(() => {
      // These are for testing purposes
      window.PLAYWRIGHT_TEST_MODE = true;
      window.mockGoogleSignInError = false;
      window.signInWithGoogleCalled = false;
    });
    
    // Basic verification that browser launches correctly
    await page.goto('about:blank');
    console.log('Browser launched successfully');
    
    await browser.close();
  } catch (error) {
    console.error('Error during Playwright setup:', error);
    // Don't fail the setup, let the tests run and potentially fail
  }
  
  console.log('Global test setup complete');
}
