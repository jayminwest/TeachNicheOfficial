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
      update: jest.fn().mockResolvedValue({ data: null, error: null })
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

  it('verifies webhook signatures and processes events', async () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          status: 'succeeded'
        }
      }
    };

    const payload = JSON.stringify(mockEvent);
    mockConstructEvent.mockReturnValueOnce(mockEvent);

    const request = new Request('http://localhost', {
      method: 'POST',
      body: payload,
      headers: new Headers({
        'stripe-signature': 'test_signature'
      })
    });

    const response = await POST(request);
    
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);
    
    expect(mockConstructEvent).toHaveBeenCalledWith(
      payload,
      'test_signature',
      webhookSecret
    );
  });

  it('handles invalid signatures', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Stripe.errors.StripeSignatureVerificationError({
        message: 'Invalid signature',
        header: 'test_signature',
        payload: '{}'
      });
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: '{}',
      headers: new Headers({
        'stripe-signature': 'invalid_signature'
      })
    });

    const response = await POST(request);
    
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Webhook signature verification failed');
  });
});
