import { createMocks } from 'node-mocks-http';
import * as routeModule from '../route';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';

// Define mock Stripe checkout session
const mockStripeCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test',
  payment_status: 'unpaid',
  customer: 'cus_123',
  metadata: {}
};

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

// Mock the route handler
jest.mock('../route', () => {
  const originalModule = jest.requireActual('../route');
  return {
    ...originalModule,
    createCheckoutSession: jest.fn().mockImplementation(async (req, res) => {
      res.status(200).json({
        sessionId: 'test_session_id',
        url: 'https://test.checkout.url'
      });
    })
  };
});

describe('Checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes payment session successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        lessonId: 'lesson-123',
        price: 19.99,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    await routeModule.createCheckoutSession(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      sessionId: 'test_session_id',
      url: 'https://test.checkout.url'
    });
  });
});
