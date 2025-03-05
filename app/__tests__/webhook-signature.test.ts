import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { POST as webhookPost } from '@/app/api/webhooks/stripe/route';

// Mock dependencies
jest.mock('stripe', () => {
  const StripeConstructor = jest.fn(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    }
  }));
  
  return { default: StripeConstructor };
});

jest.mock('@/app/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/app/services/database/purchasesService', () => ({
  purchasesService: {
    updatePurchaseStatus: jest.fn(),
    createPurchase: jest.fn(),
  }
}));

describe('Webhook Signature Verification', () => {
  let mockStripe: {
    webhooks: {
      constructEvent: jest.Mock;
    };
  };
  
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Setup Stripe mock
    mockStripe = new Stripe('mock-key', { apiVersion: '2025-01-27.acacia' });
    
    // Setup environment variables
    process.env.STRIPE_SECRET_KEY = 'mock-key';
    process.env.STRIPE_WEBHOOK_SECRET = 'mock-webhook-secret';
  });
  
  it('should verify webhook signature correctly', async () => {
    // Mock successful signature verification
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          payment_status: 'paid',
          metadata: {
            lessonId: 'lesson-123',
            userId: 'user-123'
          }
        }
      }
    });
    
    // Create mock request
    const request = {
      text: () => Promise.resolve('{"type":"checkout.session.completed"}'),
      headers: {
        get: jest.fn().mockReturnValue('mock-signature')
      }
    } as unknown as NextRequest;
    
    // Call the webhook handler
    const response = await webhookPost(request);
    
    // Verify signature was checked
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      '{"type":"checkout.session.completed"}',
      'mock-signature',
      'mock-webhook-secret'
    );
    
    // Verify successful response
    expect(response.status).toBe(200);
  });
  
  it('should return 400 if signature verification fails', async () => {
    // Mock failed signature verification
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    
    // Create mock request
    const request = {
      text: () => Promise.resolve('{"type":"checkout.session.completed"}'),
      headers: {
        get: jest.fn().mockReturnValue('invalid-signature')
      }
    } as unknown as NextRequest;
    
    // Call the webhook handler
    const response = await webhookPost(request);
    const responseData = await response.json();
    
    // Verify error response
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Webhook signature verification failed');
  });
  
  it('should return 400 if signature header is missing', async () => {
    // Create mock request with missing signature
    const request = {
      text: () => Promise.resolve('{"type":"checkout.session.completed"}'),
      headers: {
        get: jest.fn().mockReturnValue(null)
      }
    } as unknown as NextRequest;
    
    // Call the webhook handler
    const response = await webhookPost(request);
    const responseData = await response.json();
    
    // Verify error response
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'Webhook signature verification failed');
    expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });
});
