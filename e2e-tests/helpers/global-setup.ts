import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 * 
 * This script:
 * 1. Creates a test data directory if it doesn't exist
 * 2. Sets up authentication state that can be reused across tests
 * 3. Prepares the test environment with necessary data
 */
async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...');
  
  // Create test data directory if it doesn't exist
  const testDataDir = path.join(__dirname, '..', 'test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  // Create test results directory if it doesn't exist
  const testResultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  
  // Create temp directory if it doesn't exist
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Set up authentication states for different user types
  // This is commented out for now as it requires a running server with test accounts
  /*
  const browser = await chromium.launch();
  
  // Create authenticated state for buyer
  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();
  await buyerPage.goto(config.projects[0].use.baseURL as string);
  
  // Perform login for buyer
  try {
    await buyerPage.click('[data-testid="sign-in-button"]');
    await buyerPage.fill('[data-testid="email-input"]', 'test-buyer@example.com');
    await buyerPage.fill('[data-testid="password-input"]', 'TestPassword123!');
    await buyerPage.click('[data-testid="submit-sign-in"]');
    await buyerPage.waitForSelector('[data-testid="user-avatar"]');
    
    // Save authenticated state
    await buyerContext.storageState({ path: path.join(testDataDir, 'buyerAuth.json') });
    console.log('Buyer authentication state saved');
  } catch (error) {
    console.error('Failed to set up buyer authentication:', error);
  }
  
  // Create authenticated state for instructor
  const instructorContext = await browser.newContext();
  const instructorPage = await instructorContext.newPage();
  await instructorPage.goto(config.projects[0].use.baseURL as string);
  
  // Perform login for instructor
  try {
    await instructorPage.click('[data-testid="sign-in-button"]');
    await instructorPage.fill('[data-testid="email-input"]', 'test-instructor@example.com');
    await instructorPage.fill('[data-testid="password-input"]', 'TestPassword123!');
    await instructorPage.click('[data-testid="submit-sign-in"]');
    await instructorPage.waitForSelector('[data-testid="user-avatar"]');
    
    // Save authenticated state
    await instructorContext.storageState({ path: path.join(testDataDir, 'instructorAuth.json') });
    console.log('Instructor authentication state saved');
  } catch (error) {
    console.error('Failed to set up instructor authentication:', error);
  }
  
  // Create authenticated state for admin
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto(config.projects[0].use.baseURL as string);
  
  // Perform login for admin
  try {
    await adminPage.click('[data-testid="sign-in-button"]');
    await adminPage.fill('[data-testid="email-input"]', 'test-admin@example.com');
    await adminPage.fill('[data-testid="password-input"]', 'TestPassword123!');
    await adminPage.click('[data-testid="submit-sign-in"]');
    await adminPage.waitForSelector('[data-testid="user-avatar"]');
    
    // Save authenticated state
    await adminContext.storageState({ path: path.join(testDataDir, 'adminAuth.json') });
    console.log('Admin authentication state saved');
  } catch (error) {
    console.error('Failed to set up admin authentication:', error);
  }
  
  // Close browser
  await browser.close();
  */
  
  // For now, create empty auth files for testing
  fs.writeFileSync(path.join(testDataDir, 'buyerAuth.json'), JSON.stringify({ cookies: [], origins: [] }));
  fs.writeFileSync(path.join(testDataDir, 'instructorAuth.json'), JSON.stringify({ cookies: [], origins: [] }));
  fs.writeFileSync(path.join(testDataDir, 'adminAuth.json'), JSON.stringify({ cookies: [], origins: [] }));
  
  console.log('Global setup completed');
}

export default globalSetup;
