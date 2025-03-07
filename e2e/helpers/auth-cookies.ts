import { Page } from '@playwright/test';

/**
 * Sets up mock Supabase auth cookies for testing
 * 
 * @param page - Playwright page object
 * @param userId - Optional user ID (defaults to test-user-id)
 */
export async function setupAuthCookies(page: Page, userId = 'test-user-id') {
  // Clear any existing cookies first
  await page.context().clearCookies();
  
  // Set the test environment cookie
  await page.context().addCookies([
    {
      name: 'test-environment',
      value: 'true',
      domain: 'localhost',
      path: '/',
    }
  ]);
  
  // Create a mock JWT token with the user ID
  const mockToken = createMockJwt(userId);
  
  // Set the Supabase auth cookie
  await page.context().addCookies([
    {
      name: 'sb-access-token',
      value: mockToken,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'sb-refresh-token',
      value: `mock-refresh-token-${Date.now()}`,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'sb-auth-token',
      value: JSON.stringify({
        access_token: mockToken,
        refresh_token: `mock-refresh-token-${Date.now()}`,
        expires_at: Date.now() + 3600 * 1000,
        user: {
          id: userId,
          email: userId === 'test-learner-id' ? 'learner@example.com' : 
                 userId === 'test-creator-id' ? 'creator@example.com' : 'test@example.com',
          user_metadata: {
            full_name: userId === 'test-learner-id' ? 'Test Learner' : 
                       userId === 'test-creator-id' ? 'Test Creator' : 'Test User',
          }
        }
      }),
      domain: 'localhost',
      path: '/',
    }
  ]);
  
  // Also set up localStorage for components that check there
  await page.evaluate((userId) => {
    const mockUser = {
      id: userId,
      email: userId === 'test-learner-id' ? 'learner@example.com' : 
             userId === 'test-creator-id' ? 'creator@example.com' : 'test@example.com',
      user_metadata: {
        full_name: userId === 'test-learner-id' ? 'Test Learner' : 
                   userId === 'test-creator-id' ? 'Test Creator' : 'Test User',
      }
    };
    
    const mockSession = {
      access_token: `mock-access-token-${Date.now()}`,
      refresh_token: `mock-refresh-token-${Date.now()}`,
      expires_at: Date.now() + 3600 * 1000,
      user: mockUser
    };
    
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: mockSession,
      expiresAt: mockSession.expires_at,
    }));
    
    localStorage.setItem('user-profile', JSON.stringify({
      id: mockUser.id,
      full_name: mockUser.user_metadata.full_name,
      email: mockUser.email,
      avatar_url: 'https://example.com/avatar.png',
    }));
    
    // Set a flag to indicate we're in a test environment
    sessionStorage.setItem('test-environment', 'true');
  }, userId);
}

/**
 * Creates a simple mock JWT token for testing
 */
function createMockJwt(userId: string): string {
  // Create a simple mock JWT structure (not cryptographically valid, but structurally correct)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    email: userId === 'test-learner-id' ? 'learner@example.com' : 
           userId === 'test-creator-id' ? 'creator@example.com' : 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    role: 'authenticated'
  }));
  const signature = btoa('mock-signature');
  
  return `${header}.${payload}.${signature}`;
}
