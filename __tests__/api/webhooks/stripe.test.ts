/**
 * @jest-environment node
 */

import { describe, it, expect, jest } from '@jest/globals';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { POST } from '@/app/api/webhooks/stripe/route';

// Set webhook secret for testing
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

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

  beforeEach(() => {
    jest.clearAllMocks();
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

    // Create properly formatted signature (t=timestamp,v1=signature)
    const timestamp = Math.floor(Date.now() / 1000);
    const mockSignature = `t=${timestamp},v1=test_signature`;
    const rawBody = JSON.stringify({ data: 'test' });

    // Mock successful webhook verification
    mockStripeWebhooks.constructEvent.mockReturnValueOnce(mockEvent);

    const request = {
      text: () => Promise.resolve(rawBody),
      headers: {
        get: (key: string) => key === 'stripe-signature' ? mockSignature : null
      }
    } as unknown as Request;

    const response = await POST(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(mockStripeWebhooks.constructEvent).toHaveBeenCalledWith(
      rawBody,
      mockSignature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  });
});
