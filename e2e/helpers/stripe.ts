import { Page } from '@playwright/test';

/**
 * Options for mocking Stripe checkout
 */
export interface StripeCheckoutOptions {
  sessionId?: string;
  success?: boolean;
  lessonId?: string;
  price?: number;
  userId?: string;
}

/**
 * Mock a Stripe checkout session
 * 
 * @param page - Playwright page object
 * @param options - Checkout configuration options
 * @returns The mocked session ID
 */
export async function mockStripeCheckout(page: Page, options: StripeCheckoutOptions = {}) {
  const defaults = {
    sessionId: `cs_test_${Date.now()}`,
    success: true,
    lessonId: 'test-lesson-id',
    price: 9.99,
    userId: 'test-learner-id',
  };
  
  const checkoutData = { ...defaults, ...options };
  
  // Store the checkout session in localStorage
  await page.evaluate((data) => {
    const mockSessions = JSON.parse(localStorage.getItem('mock-stripe-sessions') || '{}');
    mockSessions[data.sessionId] = {
      id: data.sessionId,
      lessonId: data.lessonId,
      price: data.price,
      userId: data.userId,
      status: data.success ? 'complete' : 'failed',
      created: Date.now(),
    };
    localStorage.setItem('mock-stripe-sessions', JSON.stringify(mockSessions));
    
    // If successful, also mark the lesson as purchased
    if (data.success) {
      const purchasedLessons = JSON.parse(localStorage.getItem('purchased-lessons') || '[]');
      if (!purchasedLessons.includes(data.lessonId)) {
        purchasedLessons.push(data.lessonId);
        localStorage.setItem('purchased-lessons', JSON.stringify(purchasedLessons));
      }
    }
  }, checkoutData);
  
  return checkoutData.sessionId;
}

/**
 * Mock Stripe Connect account status
 * 
 * @param page - Playwright page object
 * @param status - Account status to mock
 * @param accountId - Stripe account ID
 * @param userId - User ID
 */
export async function mockStripeConnectAccount(
  page: Page, 
  status: 'pending' | 'complete' | 'incomplete' = 'complete',
  accountId: string = 'acct_test123456',
  userId: string = 'test-creator-id'
) {
  await page.evaluate(({ status, accountId, userId }) => {
    // Update user profile with Stripe account info
    const userProfile = JSON.parse(localStorage.getItem('user-profile') || '{}');
    if (userProfile.id === userId) {
      userProfile.stripe_account_id = accountId;
      userProfile.stripe_account_status = status;
      userProfile.stripe_onboarding_complete = status === 'complete';
      localStorage.setItem('user-profile', JSON.stringify(userProfile));
    }
    
    // Store mock Stripe account data
    const mockAccounts = JSON.parse(localStorage.getItem('mock-stripe-accounts') || '{}');
    mockAccounts[accountId] = {
      id: accountId,
      userId,
      status,
      details_submitted: status !== 'incomplete',
      charges_enabled: status === 'complete',
      payouts_enabled: status === 'complete',
    };
    localStorage.setItem('mock-stripe-accounts', JSON.stringify(mockAccounts));
  }, { status, accountId, userId });
}

/**
 * Clear all mock Stripe data
 * 
 * @param page - Playwright page object
 */
export async function clearMockStripeData(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('mock-stripe-sessions');
    localStorage.removeItem('mock-stripe-accounts');
  });
}
