import { test, expect } from '@playwright/test';

// Make sure the app is running before tests
test.beforeAll(async ({ browser }) => {
  // Create a new context and page just for checking server availability
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Checking if server is running...');
  
  // Try to connect to the server with more generous timeout and retries
  let isServerRunning = false;
  let attempts = 5;
  
  while (attempts > 0 && !isServerRunning) {
    try {
      const response = await page.goto('/', { timeout: 60000 });
      if (response && response.status() < 400) {
        isServerRunning = true;
        console.log('Server is running and accessible');
      }
    } catch (error) {
      console.log(`Server check attempt failed, ${attempts-1} attempts remaining`);
      if (attempts > 1) {
        console.log('Waiting 10 seconds before retrying...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        console.log('WARNING: Server appears to be unavailable. Tests may fail.');
        console.log('Please ensure the development server is running with: npm run dev');
      }
    }
    attempts--;
  }
  
  // Clean up the context used for checking
  await context.close();
});

// Navigate to the home page before each test
test.beforeEach(async ({ page }) => {
  try {
    const response = await page.goto('/', { timeout: 30000 });
    expect(response?.status()).toBeLessThan(400);
  } catch (error) {
    console.error('Failed to navigate to home page:', error);
    throw new Error('Server is not accessible. Please start the development server with: npm run dev');
  }
});

test.describe('Authentication flows', () => {
  test('User can sign up with email', async ({ page }) => {
    // Generate a unique email for testing
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    
    // We're already on the home page from beforeEach
    
    // Open auth dialog
    await page.click('[data-testid="sign-up-button"]');
    
    // Fill in sign up form
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.fill('[data-testid="full-name-input"]', 'Test User');
    
    // Submit form
    await page.click('[data-testid="submit-sign-up"]');
    
    // Verify successful sign up (redirected to dashboard or profile completion)
    await page.waitForURL(/.*dashboard|profile.*/);
    
    // Verify user is logged in (avatar or user menu is visible)
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
  
  test('User can log in with email', async ({ page }) => {
    // Use test account credentials
    const testEmail = 'existing-user@example.com';
    const testPassword = 'ExistingPassword123!';
    
    // We're already on the home page from beforeEach
    
    // Open auth dialog
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in login form
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testPassword);
    
    // Submit form
    await page.click('[data-testid="submit-sign-in"]');
    
    // Verify successful login
    await page.waitForURL(/.*dashboard.*/);
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
  
  test('User sees error with invalid credentials', async ({ page }) => {
    // We're already on the home page from beforeEach
    
    // Open auth dialog
    await page.click('[data-testid="sign-in-button"]');
    
    // Fill in login form with invalid credentials
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
    
    // Submit form
    await page.click('[data-testid="submit-sign-in"]');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="auth-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error-message"]')).toContainText('Invalid credentials');
  });
});
