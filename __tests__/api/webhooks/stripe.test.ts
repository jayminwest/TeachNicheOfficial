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

describe('Stripe Webhook Handler', () => {
  it('handles missing signatures', async () => {
    const request = {
      text: () => Promise.resolve('{}'),
      headers: {
        get: () => null
      }
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
      text: () => Promise.resolve(JSON.stringify({ data: 'test' })),
      headers: {
        get: () => 'test_signature'
      }
    } as unknown as Request;

    const response = await POST(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(mockStripeWebhooks.constructEvent).toHaveBeenCalled();
  });
});
