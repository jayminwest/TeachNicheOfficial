import { createMocks } from 'node-mocks-http';
import { createCheckoutSession } from '../route';
import { mockStripeCheckoutSession } from '../../../../__mocks__/services/stripe';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';

// Mock the stripe service
jest.mock('../../../../app/services/stripe', () => ({
  createCheckoutSession: jest.fn().mockImplementation(
    (options: any, config?: MockConfig) => {
      if (config?.shouldSucceed === false) {
        throw new Error(config.errorMessage || 'Stripe error');
      }
      return Promise.resolve(mockStripeCheckoutSession);
    }
  ),
  StripeError: class StripeError extends Error {
    constructor(public code: string, message: string) {
      super(message);
      this.name = 'StripeError';
    }
  }
}));

// Mock auth
jest.mock('../../../../app/services/auth', () => ({
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
        priceId: 'price-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    await createCheckoutSession(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      sessionId: mockStripeCheckoutSession.id,
      url: mockStripeCheckoutSession.url
    });
  });

  it('validates input data and returns 400 for missing fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Missing required fields
        lessonId: 'lesson-123'
      }
    });

    await createCheckoutSession(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });

  it('enforces authentication and returns 401 for unauthenticated requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        lessonId: 'lesson-123',
        priceId: 'price-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    // Mock auth to fail
    require('../../../../app/services/auth').getCurrentUser.mockImplementationOnce(() => Promise.resolve(null));

    await createCheckoutSession(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        message: expect.any(String)
      }
    });
  });

  it('handles Stripe errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        lessonId: 'lesson-123',
        priceId: 'price-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    // Mock Stripe to throw an error
    require('../../../../app/services/stripe').createCheckoutSession.mockImplementationOnce(() => {
      throw new Error('Stripe service error');
    });

    await createCheckoutSession(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        message: expect.any(String)
      }
    });
  });

  it('handles specific Stripe error codes appropriately', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        lessonId: 'lesson-123',
        priceId: 'price-123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    const StripeError = require('../../../../app/services/stripe').StripeError;
    
    // Mock Stripe to throw a specific error
    require('../../../../app/services/stripe').createCheckoutSession.mockImplementationOnce(() => {
      throw new StripeError('account_mismatch', 'Account mismatch error');
    });

    await createCheckoutSession(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        code: 'account_mismatch',
        message: expect.any(String)
      }
    });
  });
});
