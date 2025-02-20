/**
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { POST } from '@/app/api/webhooks/stripe/route';

// Mock Stripe
const mockConstructEvent = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent
    }
  }));
});

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockResolvedValue({ data: {}, error: null })
    })
  })
}));

describe('Stripe Webhook Handler', () => {
  const webhookSecret = 'whsec_test_secret';
  
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    jest.clearAllMocks();
  });

  it('handles missing signatures', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: new Headers()
    });

    const response = await POST(request);
    
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing stripe-signature header');
  });


  it('handles invalid signatures', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const invalidSignature = `t=${timestamp},v1=invalid_signature`;
    
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Stripe.errors.StripeSignatureVerificationError({
        message: 'Invalid signature',
        headers: invalidSignature,
        payload: '{}'
      });
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: '{}',
      headers: new Headers({
        'stripe-signature': invalidSignature
      })
    });

    const response = await POST(request);
    
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Webhook signature verification failed');
  });
});
