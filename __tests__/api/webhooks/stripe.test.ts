/**
 * @jest-environment node
 */

import { describe, it, expect, jest } from '@jest/globals';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { POST } from '@/app/api/webhooks/stripe/route';

// Mock Stripe constructor and methods
const mockStripeWebhooks = {
  constructEvent: jest.fn()
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: mockStripeWebhooks
  }));
});

// Mock next/headers
let mockHeadersGet = jest.fn().mockImplementation((key) => 
  key === 'stripe-signature' ? 'test_signature' : null
);

jest.mock('next/headers', () => ({
  headers: () => ({
    get: mockHeadersGet
  }),
  cookies: () => ({})
}));

describe('Stripe Webhook Handler', () => {
  it('handles missing signatures', async () => {
    mockHeadersGet.mockReturnValueOnce(null);
    
    const request = {
      text: () => Promise.resolve('{}')
    } as unknown as Request;

    const response = await POST(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing stripe-signature header');
  });

  it('verifies webhook signatures', async () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          status: 'succeeded'
        }
      }
    };

    mockStripeWebhooks.constructEvent.mockReturnValueOnce(mockEvent);

    const request = {
      text: () => Promise.resolve(JSON.stringify({ data: 'test' }))
    } as unknown as Request;

    const response = await POST(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(mockStripeWebhooks.constructEvent).toHaveBeenCalled();
  });
});
