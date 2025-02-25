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
  await page.addInitScript(() => {
    window.mockAuthSuccess = arguments[0].success;
    window.mockAuthError = arguments[0].errorMessage;
    
    // Override the signInWithGoogle function
    window.originalSignInWithGoogle = window.signInWithGoogle;
    window.signInWithGoogle = async function() {
      console.log('Mocked signInWithGoogle called');
      
      if (window.mockAuthSuccess) {
        // Return a successful response
        return { 
          data: { 
            user: {
              id: arguments[0].userId,
              email: arguments[0].email,
              user_metadata: {
                full_name: arguments[0].fullName,
                avatar_url: arguments[0].avatarUrl
              }
            },
            session: { access_token: 'mock-token' }
          },
          error: null
        };
      } else {
        // Throw an error to simulate failure
        throw new Error(window.mockAuthError);
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
  test('User can sign in with Google', async ({ page, context }) => {
    // We're already on the home page from beforeEach
    
    // Open auth dialog by clicking the sign-in button
    await page.click('button:has-text("Sign In"), a:has-text("Sign In")');
    
    // Mock Google OAuth flow
    // Note: In a real test, you would need to handle the Google OAuth popup
    // This is a simplified version that mocks the response
    
    // Click the Google sign-in button
    const googleSignInButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleSignInButton).toBeVisible({ timeout: 5000 });
    
    // Set up route interception for the Supabase auth endpoint
    await mockGoogleOAuthResponse(page, { success: true });
    
    // Click the Google sign-in button which would normally open a popup
    await googleSignInButton.click();
    
    // In a real test with a popup, you would need to handle the popup window
    // For this mock version, we'll simulate the callback directly
    
    // Verify successful login (redirected to dashboard or profile)
    await page.waitForURL(/.*dashboard.*|.*profile.*/, { timeout: 30000 });
    
    // Verify user is logged in (avatar or user menu is visible)
    // Using a more generic selector that might match the user avatar
    await expect(
      page.locator('img[alt*="avatar" i], img[alt*="profile" i], img[alt*="user" i], button:has(svg), .avatar, .user-avatar')
    ).toBeVisible({ timeout: 5000 });
  });
  
  test('User can sign up with Google', async ({ page }) => {
    // We're already on the home page from beforeEach
    
    // Open auth dialog in sign-up mode
    await page.click('button:has-text("Sign Up"), a:has-text("Sign Up")');
    
    // Click the Google sign-up button
    const googleSignUpButton = page.locator('button:has-text("Sign up with Google")');
    await expect(googleSignUpButton).toBeVisible({ timeout: 5000 });
    
    // Set up route interception for the Supabase auth endpoint
    await mockGoogleOAuthResponse(page, { 
      success: true,
      userId: 'new-google-user-456',
      email: 'new-google-user@example.com',
      fullName: 'New Google User',
      isNewUser: true
    });
    
    // Click the Google sign-up button
    await googleSignUpButton.click();
    
    // Verify successful sign up (redirected to onboarding or dashboard)
    await page.waitForURL(/.*onboarding|dashboard|profile.*/, { timeout: 30000 });
    
    // Verify user is logged in
    // Using a more generic selector that might match the user avatar
    await expect(
      page.locator('img[alt*="avatar" i], img[alt*="profile" i], img[alt*="user" i], button:has(svg), .avatar, .user-avatar')
    ).toBeVisible({ timeout: 5000 });
  });
  
  test('User sees error with Google authentication failure', async ({ page }) => {
    // We're already on the home page from beforeEach
    
    // Open auth dialog
    await page.click('button:has-text("Sign In"), a:has-text("Sign In")');
    
    // Click the Google sign-in button
    const googleSignInButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleSignInButton).toBeVisible({ timeout: 5000 });
    
    // Set up route interception to simulate a failure
    await mockGoogleOAuthResponse(page, { 
      success: false,
      errorMessage: 'Failed to sign in with Google'
    });
    
    // Click the Google sign-in button
    await googleSignInButton.click();
    
    // Verify error message is displayed - using the selector that matches the error message in sign-in.tsx
    const errorMessage = page.locator('.text-red-500');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/failed|error|invalid/i);
  });
});
