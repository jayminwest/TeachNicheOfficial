/**
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { POST } from '@/app/api/webhooks/stripe/route';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs');

let mockHeadersGet = jest.fn().mockImplementation((key) => 
  key === 'stripe-signature' ? 'test_signature' : null
);

jest.mock('next/headers', () => ({
  headers: () => ({
    get: mockHeadersGet
  }),
  cookies: () => ({})
}));

// Setup Request mock
const mockRequest = (body: any) => ({
  text: () => Promise.resolve(JSON.stringify(body))
} as unknown as Request);

// Mock Stripe constructor and methods
const mockStripeWebhooks = {
  constructEvent: jest.fn()
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: mockStripeWebhooks
  }));
});

describe('Stripe Webhook Handler', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error: null })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
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

    const request = mockRequest({ data: 'test' });

    const response = await POST(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(mockStripeWebhooks.constructEvent).toHaveBeenCalled();
  });

  it('handles missing signatures', async () => {
    mockHeadersGet.mockReturnValueOnce(null);

    const request = mockRequest({ data: 'test' });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing stripe-signature header');
  });

  it('processes payment_intent.succeeded events', async () => {
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

    const request = mockRequest({ data: 'test' });

    const response = await POST(request);
    expect(response.status).toBe(200);
    // Add assertions for database updates once implemented
  });

  it('handles account.updated events', async () => {
    const mockEvent = {
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_123',
          details_submitted: true
        }
      }
    };

    mockStripeWebhooks.constructEvent.mockReturnValueOnce(mockEvent);

    const request = mockRequest({ data: 'test' });

    const response = await POST(request);
    expect(response.status).toBe(200);
    // Add assertions for database updates once implemented
  });

  it('rejects invalid signatures', async () => {
    mockStripeWebhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });

    const request = mockRequest({ data: 'test' });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Webhook signature verification failed');
  });
});
