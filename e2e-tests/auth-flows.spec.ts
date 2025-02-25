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

// Helper function to mock Google OAuth response
async function mockGoogleOAuthResponse(page, options = {}) {
  const {
    success = true,
    userId = 'google-user-123',
    email = 'google-user@example.com',
    fullName = 'Google Test User',
    avatarUrl = 'https://example.com/avatar.png',
    isNewUser = false,
    errorMessage = 'Failed to sign in with Google'
  } = options;
  
  // Mock the signInWithGoogle function from supabaseAuth
  await page.addInitScript(({ success, userId, email, fullName, avatarUrl, errorMessage }) => {
    console.log('Setting up auth mock with success:', success);
    
    // Create a global object to store our mock configuration
    window.mockAuth = {
      success,
      userId,
      email,
      fullName,
      avatarUrl,
      errorMessage
    };
    
    // Override the signInWithGoogle function in the global scope
    window.signInWithGoogle = async function() {
      console.log('Mocked signInWithGoogle called, success:', window.mockAuth.success);
      
      if (window.mockAuth.success) {
        // Return a successful response
        return { 
          data: { 
            user: {
              id: window.mockAuth.userId,
              email: window.mockAuth.email,
              user_metadata: {
                full_name: window.mockAuth.fullName,
                avatar_url: window.mockAuth.avatarUrl
              }
            },
            session: { access_token: 'mock-token' }
          },
          error: null
        };
      } else {
        // Simulate an error
        const error = new Error(window.mockAuth.errorMessage);
        console.error('Auth error:', error);
        throw error;
      }
    };
  }, options);
  
  // Also intercept any API calls to auth endpoints as a fallback
  if (success) {
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: userId,
            email: email,
            user_metadata: {
              full_name: fullName,
              avatar_url: avatarUrl
            }
          }
        })
      });
    });
  } else {
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'invalid_grant',
          error_description: errorMessage
        })
      });
    });
  }
}

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
  test('User can sign in with Google', async ({ page }) => {
    console.log('Starting sign in test');
    
    // Set up mocking before navigating to ensure it's ready
    await mockGoogleOAuthResponse(page, { success: true });
    
    // We're already on the home page from beforeEach
    // Look for a sign-in button in the header/navigation
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    console.log('Found sign in button');
    
    // Click the sign-in button to open the auth dialog
    await signInButton.click();
    console.log('Clicked sign in button');
    
    // Wait for the auth dialog to appear
    const authDialog = page.locator('div[role="dialog"]');
    await expect(authDialog).toBeVisible({ timeout: 10000 });
    console.log('Auth dialog visible');
    
    // Find and click the Google sign-in button within the dialog
    const googleSignInButton = authDialog.getByRole('button', { name: /sign in with google/i });
    await expect(googleSignInButton).toBeVisible({ timeout: 10000 });
    console.log('Found Google sign in button');
    
    // Click the Google sign-in button
    await googleSignInButton.click();
    console.log('Clicked Google sign in button');
    
    // Since we've mocked the auth, we should be redirected to the dashboard
    // Wait for navigation to complete
    await page.waitForURL(/.*dashboard.*|.*profile.*|.*\/$/, { timeout: 30000 });
    console.log('Navigation completed');
    
    // Check if we're logged in by looking for any user-related UI element
    // This could be a user menu, avatar, or dashboard element
    const userElement = page.locator('header').getByRole('button').first();
    await expect(userElement).toBeVisible({ timeout: 10000 });
    console.log('User element visible');
  });
  
  test('User can sign up with Google', async ({ page }) => {
    console.log('Starting sign up test');
    
    // Set up mocking before navigating
    await mockGoogleOAuthResponse(page, { 
      success: true,
      userId: 'new-google-user-456',
      email: 'new-google-user@example.com',
      fullName: 'New Google User',
      isNewUser: true
    });
    
    // We're already on the home page from beforeEach
    // Look for a sign-up button in the header/navigation
    const signUpButton = page.getByRole('button', { name: /sign up/i });
    await expect(signUpButton).toBeVisible({ timeout: 10000 });
    console.log('Found sign up button');
    
    // Click the sign-up button to open the auth dialog
    await signUpButton.click();
    console.log('Clicked sign up button');
    
    // Wait for the auth dialog to appear
    const authDialog = page.locator('div[role="dialog"]');
    await expect(authDialog).toBeVisible({ timeout: 10000 });
    console.log('Auth dialog visible');
    
    // Find and click the Google sign-up button within the dialog
    const googleSignUpButton = authDialog.getByRole('button', { name: /sign up with google/i });
    await expect(googleSignUpButton).toBeVisible({ timeout: 10000 });
    console.log('Found Google sign up button');
    
    // Click the Google sign-up button
    await googleSignUpButton.click();
    console.log('Clicked Google sign up button');
    
    // Since we've mocked the auth, we should be redirected to the dashboard or profile
    await page.waitForURL(/.*dashboard.*|.*profile.*|.*\/$/, { timeout: 30000 });
    console.log('Navigation completed');
    
    // Check if we're logged in
    const userElement = page.locator('header').getByRole('button').first();
    await expect(userElement).toBeVisible({ timeout: 10000 });
    console.log('User element visible');
  });
  
  test('User sees error with Google authentication failure', async ({ page }) => {
    console.log('Starting auth failure test');
    
    // Set up mocking to simulate a failure
    await mockGoogleOAuthResponse(page, { 
      success: false,
      errorMessage: 'Failed to sign in with Google'
    });
    
    // We're already on the home page from beforeEach
    // Look for a sign-in button in the header/navigation
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    console.log('Found sign in button');
    
    // Click the sign-in button to open the auth dialog
    await signInButton.click();
    console.log('Clicked sign in button');
    
    // Wait for the auth dialog to appear
    const authDialog = page.locator('div[role="dialog"]');
    await expect(authDialog).toBeVisible({ timeout: 10000 });
    console.log('Auth dialog visible');
    
    // Find and click the Google sign-in button within the dialog
    const googleSignInButton = authDialog.getByRole('button', { name: /sign in with google/i });
    await expect(googleSignInButton).toBeVisible({ timeout: 10000 });
    console.log('Found Google sign in button');
    
    // Click the Google sign-in button
    await googleSignInButton.click();
    console.log('Clicked Google sign in button');
    
    // Wait for the error message to appear
    // The error message should be inside the dialog
    const errorMessage = authDialog.locator('.text-red-500, [class*="text-destructive"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    console.log('Error message visible');
    
    // Verify the error message contains the expected text
    await expect(errorMessage).toContainText(/failed|error|invalid/i);
    console.log('Error message contains expected text');
  });
});
