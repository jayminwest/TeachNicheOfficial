import { jest } from '@jest/globals';

export const mockStripeClient = {
  redirectToCheckout: jest.fn().mockResolvedValue({ error: null }),
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test123',
          payment_status: 'paid',
          metadata: {
            lessonId: 'lesson_123'
          }
        }
      }
    }),
  },
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        payment_status: 'unpaid',
        customer: 'cus_test123',
        metadata: {}
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid'
      })
    }
  },
  accounts: {
    create: jest.fn().mockResolvedValue({
      id: 'acct_test123',
      object: 'account',
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true
    }),
    createLoginLink: jest.fn().mockResolvedValue({
      url: 'https://connect.stripe.com/setup/test'
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'acct_test123',
      charges_enabled: true
    })
  },
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com'
    }),
    update: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      metadata: { updated: true }
    }),
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret'
    })
  }
};

export const mockCheckoutSession = {
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
  }]
};

export const mockStripeError = (type: string, message: string) => ({
  type,
  message,
  code: 'stripe_error',
  decline_code: type === 'card_declined' ? 'generic_decline' : null,
  raw: { message }
});
