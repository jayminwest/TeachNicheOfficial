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
  paymentStatus?: 'paid' | 'unpaid' | 'no_payment_required';
  metadata?: Record<string, any>;
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
/**
 * Mocks a Stripe checkout session for testing
 * 
 * @param page - Playwright page object
 * @param options - Configuration options for the mock checkout session
 * @returns The mocked session data
 */
export async function mockStripeCheckoutSession(page, options = {}) {
  const defaults = {
    sessionId: `cs_test_${Date.now()}`,
    success: true,
    lessonId: 'test-lesson-id',
    price: 9.99,
    userId: 'test-user-id',
    paymentStatus: 'paid',
    metadata: {
      lessonId: 'test-lesson-id',
      userId: 'test-user-id'
    }
  };
  
  const sessionData = { ...defaults, ...options };
  
  // Store the mock session in localStorage
  await page.evaluate((session) => {
    const mockSessions = JSON.parse(localStorage.getItem('mock-stripe-sessions') || '{}');
    mockSessions[session.sessionId] = session;
    localStorage.setItem('mock-stripe-sessions', JSON.stringify(mockSessions));
    
    // If successful payment, also update user's purchased lessons
    if (session.success && session.paymentStatus === 'paid') {
      const userLessons = JSON.parse(localStorage.getItem(`user-${session.userId}-lessons`) || '[]');
      if (!userLessons.includes(session.lessonId)) {
        userLessons.push(session.lessonId);
        localStorage.setItem(`user-${session.userId}-lessons`, JSON.stringify(userLessons));
      }
    }
  }, sessionData);
  
  return sessionData;
}

/**
 * Mocks a Stripe Connect account for testing
 * 
 * @param page - Playwright page object
 * @param userId - ID of the user
 * @param status - Status of the Stripe Connect account
 * @returns The mocked account data
 */
export async function mockStripeConnectAccount(page, userId, status = 'complete') {
  const accountData = {
    id: `acct_${Date.now()}`,
    userId,
    status,
    details_submitted: status === 'complete',
    charges_enabled: status === 'complete',
    payouts_enabled: status === 'complete',
    requirements: {
      currently_due: status === 'complete' ? [] : ['external_account'],
      eventually_due: [],
      past_due: [],
      pending_verification: []
    }
  };
  
  await page.evaluate((account) => {
    const mockAccounts = JSON.parse(localStorage.getItem('mock-stripe-accounts') || '{}');
    mockAccounts[account.userId] = account;
    localStorage.setItem('mock-stripe-accounts', JSON.stringify(mockAccounts));
    
    // Also update the user's profile with Stripe account info
    const profiles = JSON.parse(localStorage.getItem('mock-profiles') || '{}');
    if (profiles[account.userId]) {
      profiles[account.userId].stripe_account_id = account.id;
      profiles[account.userId].stripe_account_status = account.status;
      profiles[account.userId].stripe_onboarding_complete = account.status === 'complete';
      localStorage.setItem('mock-profiles', JSON.stringify(profiles));
    }
  }, accountData);
  
  return accountData;
}

/**
 * Simulates a Stripe webhook event for testing
 * 
 * @param page - Playwright page object
 * @param eventType - Type of Stripe event
 * @param data - Event data
 */
export async function simulateStripeWebhook(page, eventType, data) {
  await page.evaluate(({ type, eventData }) => {
    const webhookEvents = JSON.parse(localStorage.getItem('mock-stripe-webhooks') || '[]');
    webhookEvents.push({
      id: `evt_${Date.now()}`,
      type,
      data: {
        object: eventData
      },
      created: Date.now() / 1000
    });
    localStorage.setItem('mock-stripe-webhooks', JSON.stringify(webhookEvents));
    
    // Dispatch a custom event that our mock webhook handler can listen for
    const event = new CustomEvent('mock-stripe-webhook', {
      detail: { type, data: eventData }
    });
    window.dispatchEvent(event);
  }, { type: eventType, eventData: data });
}
