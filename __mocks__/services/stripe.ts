import { jest } from '@jest/globals';

export const mockStripeClient = {
  redirectToCheckout: jest.fn(),
  webhooks: {
    constructEvent: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      })
    }
  },
  accounts: {
    create: jest.fn().mockResolvedValue({
      id: 'acct_test123',
      object: 'account'
    }),
    createLoginLink: jest.fn(),
  },
  customers: {
    create: jest.fn(),
    update: jest.fn(),
  }
};

export const mockCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test'
};

export const mockStripeError = (type: string, message: string) => 
  new Error(message) as any;
