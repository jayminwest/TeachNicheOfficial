import { Page } from '@playwright/test';

/**
 * User roles for testing
 */
export type UserRole = 'learner' | 'creator' | 'admin';

/**
 * Mock user data for different roles
 */
const mockUsers = {
  learner: {
    id: 'test-learner-id',
    email: 'learner@example.com',
    name: 'Test Learner',
    role: 'learner',
  },
  creator: {
    id: 'test-creator-id',
    email: 'creator@example.com',
    name: 'Test Creator',
    role: 'creator',
    stripeAccountId: 'acct_test123456',
    stripeAccountStatus: 'complete',
  },
  admin: {
    id: 'test-admin-id',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
  },
};

/**
 * Login helper to mock authentication for E2E tests
 * 
 * @param page - Playwright page object
 * @param role - User role to mock (learner, creator, admin)
 * @param options - Additional options for the mock user
 */
export async function login(
  page: Page, 
  role: UserRole = 'learner',
  options: Record<string, any> = {}
) {
  const userData = { ...mockUsers[role], ...options };
  
  // First navigate to the app to ensure we're on the right domain
  await page.goto('/');
  
  // Set up localStorage with mock auth data
  await page.evaluate((data) => {
    // Clear any existing auth data first
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('user-profile');
    
    // Mock Supabase auth session
    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600 * 1000, // 1 hour from now
      user: {
        id: data.id,
        email: data.email,
        user_metadata: {
          full_name: data.name,
          avatar_url: 'https://example.com/avatar.png',
        },
      },
    };
    
    try {
      // Store in localStorage
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: mockSession,
        expiresAt: mockSession.expires_at,
      }));
      
      // Store user profile data
      localStorage.setItem('user-profile', JSON.stringify({
        id: data.id,
        full_name: data.name,
        email: data.email,
        avatar_url: 'https://example.com/avatar.png',
        stripe_account_id: 'stripeAccountId' in data ? data.stripeAccountId : null,
        stripe_account_status: 'stripeAccountStatus' in data ? data.stripeAccountStatus : null,
        stripe_onboarding_complete: 'stripeAccountStatus' in data ? data.stripeAccountStatus === 'complete' : false,
      }));
    } catch (e) {
      console.error('Failed to set localStorage:', e);
    }
  }, userData);
  
  // Refresh the page to apply the auth state
  await page.reload();
  
  // Wait for a moment to ensure the auth state is applied
  await page.waitForTimeout(1000);
}

/**
 * Logout helper to clear authentication state
 * 
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // First navigate to the app to ensure we're on the right domain
  await page.goto('/');
  
  try {
    await page.evaluate(() => {
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('user-profile');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    });
  } catch (e) {
    console.error('Failed to execute logout script:', e);
  }
  
  // Refresh the page to apply the logout
  await page.reload();
}
