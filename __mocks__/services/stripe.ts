import { jest } from '@jest/globals';
import { createMockResponse, createAsyncMock, MockConfig, resetMocks } from '../utils/mock-helpers';

// Types for Stripe data
export interface StripeAccount {
  id: string;
  object: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

export interface StripeCustomer {
  id: string;
  email: string;
  metadata?: Record<string, any>;
}

export interface StripeCheckoutSession {
  id: string;
  url?: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  customer: string;
  metadata: Record<string, any>;
  line_items?: Array<{
    price: string;
    quantity: number;
  }>;
}

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  amount: number;
  currency: string;
}

// Factory functions to create mock data
export const createMockAccount = (overrides = {}): StripeAccount => ({
  id: 'acct_test123',
  object: 'account',
  charges_enabled: true,
  payouts_enabled: true,
  details_submitted: true,
  ...overrides
});

export const createMockCustomer = (overrides = {}): StripeCustomer => ({
  id: 'cus_test123',
  email: 'test@example.com',
  metadata: {},
  ...overrides
});

export const createMockCheckoutSession = (overrides = {}): StripeCheckoutSession => ({
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test',
  payment_status: 'unpaid',
  customer: 'cus_test123',
  metadata: {
    lessonId: 'lesson_123'
  },
  line_items: [{
    price: 'price_123',
    quantity: 1
  }],
  ...overrides
});

export const createMockPaymentIntent = (overrides = {}): StripePaymentIntent => ({
  id: 'pi_test123',
  client_secret: 'pi_test123_secret',
  status: 'requires_payment_method',
  amount: 1000,
  currency: 'usd',
  ...overrides
});

// Create mock Stripe client with configurable behavior
export const createMockStripeClient = (config: MockConfig = {}) => {
  const mockAccount = createMockAccount();
  const mockCustomer = createMockCustomer();
  const mockSession = createMockCheckoutSession();
  const mockPaymentIntent = createMockPaymentIntent();

  return {
    redirectToCheckout: createAsyncMock({ error: null }, config),
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: mockSession
        }
      })
    },
    checkout: {
      sessions: {
        create: createAsyncMock(mockSession, config),
        retrieve: createAsyncMock({ ...mockSession, payment_status: 'paid' }, config)
      }
    },
    accounts: {
      create: createAsyncMock(mockAccount, config),
      createLoginLink: createAsyncMock({ url: 'https://connect.stripe.com/setup/test' }, config),
      retrieve: createAsyncMock(mockAccount, config)
    },
    customers: {
      create: createAsyncMock(mockCustomer, config),
      update: createAsyncMock({ ...mockCustomer, metadata: { updated: true } }, config),
      retrieve: createAsyncMock(mockCustomer, config),
      list: createAsyncMock({ data: [mockCustomer], has_more: false }, config)
    },
    paymentIntents: {
      create: createAsyncMock(mockPaymentIntent, config),
      update: createAsyncMock(mockPaymentIntent, config),
      retrieve: createAsyncMock(mockPaymentIntent, config),
      confirm: createAsyncMock({ ...mockPaymentIntent, status: 'succeeded' }, config)
    }
  };
};

export const mockStripeClient = createMockStripeClient();

export const mockStripeError = (type: string, message: string) => ({
  type,
  message,
  code: 'stripe_error',
  decline_code: type === 'card_declined' ? 'generic_decline' : null,
  raw: { message }
});

// Export function to reset all mocks
export const resetStripeMocks = () => resetMocks(mockStripeClient);
