import { createMocks } from 'node-mocks-http';
import { createCheckoutSession } from '../route';
import { mockStripeCheckoutSession } from '../../../../__mocks__/services/stripe';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';

// Mock the stripe service
jest.mock('../../../services/stripe', () => ({
  createCheckoutSession: jest.fn().mockImplementation(
    (options, config) => {
      if (config?.shouldSucceed === false) {
        throw new Error(config.errorMessage || 'Stripe error');
      }
      return Promise.resolve(mockStripeCheckoutSession);
    }
  ),
  StripeError: jest.fn().mockImplementation(function(code, message) {
    const error = new Error(message);
    error.name = 'StripeError';
    error.code = code;
    return error;
  })
}));

// Mock auth
jest.mock('../../../services/auth', () => ({
  getCurrentUser: jest.fn().mockImplementation((config?: MockConfig) => {
    if (config?.shouldSucceed === false) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      id: 'user-123',
      email: 'test@example.com'
    });
  })
}));

describe('Checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes payment session successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        lessonId: 'lesson-123',
        price: 19.99,  // Changed from priceId to price
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    await createCheckoutSession(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      sessionId: mockStripeCheckoutSession.id
    });
  });
});
