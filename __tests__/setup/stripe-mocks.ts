export const mockStripeClient = {
  redirectToCheckout: jest.fn(),
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
    })
  }
};

export const mockCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test'
};
