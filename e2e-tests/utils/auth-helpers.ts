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
  
  // Instead of trying to find and click the sign-in button, use direct mocking
  // This is more reliable for tests and avoids UI interaction issues
  console.log('Using direct auth mocking for tests');
  
  try {
    // Directly set authentication state in the browser context
    await page.evaluate(({ email }) => {
      // Create a mock user session
      const mockUser = {
        id: 'test-user-id',
        email: email,
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.png'
        }
      };
      
      // Store in localStorage to simulate authenticated state
      localStorage.setItem('firebaseAuth.token', JSON.stringify({
        currentSession: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: mockUser
        },
        expiresAt: Date.now() + 3600000
      }));
      
      // Set a flag to indicate test authentication
      localStorage.setItem('test-auth-bypass', 'true');
      
      console.log('Mock authentication set in localStorage');
      return true;
    }, { email });
    
    // Reload the page to apply the authentication
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log('Authentication mocking completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to set mock authentication:', error);
    
    // Take a screenshot for debugging but handle potential errors
    try {
      await page.screenshot({ path: `debug-auth-error-${Date.now()}.png` });
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }
    
    // Continue with the test even if authentication fails
    // This allows tests to proceed with unauthenticated state if needed
    console.warn('Continuing test with unauthenticated state');
    return false;
  }
}

/**
 * Helper function to set up mock authentication
 * 
 * @param page Playwright page object
 */
export async function setupMockAuth(page: Page) {
  console.log('Setting up mock authentication');
  
  try {
    // Directly set authentication state in the browser context
    await page.evaluate(() => {
      // Create a mock user session
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.png'
        }
      };
      
      // Store in localStorage to simulate authenticated state
      localStorage.setItem('firebaseAuth.token', JSON.stringify({
        currentSession: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: mockUser
        },
        expiresAt: Date.now() + 3600000
      }));
      
      // Set a flag to indicate test authentication
      localStorage.setItem('test-auth-bypass', 'true');
      
      console.log('Mock authentication set in localStorage');
      return true;
    });
    
    console.log('Mock authentication setup completed successfully');
  } catch (error) {
    console.error('Failed to set up mock authentication:', error);
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

/**
 * Helper function to set up common API mocks
 * 
 * @param page Playwright page object
 */
export async function setupApiMocks(page: Page) {
  // Set up route interception for authentication
  await page.route('**/api/auth/signin', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 
        success: true, 
        user: { 
          email: 'test@example.com',
          id: 'test-user-id'
        } 
      })
    });
  });
  
  await page.route('**/api/auth/signout', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}
