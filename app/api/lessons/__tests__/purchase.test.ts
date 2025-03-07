import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../purchase/route';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { purchasesService } from '@/app/services/database/purchasesService';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('@/app/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn()
}));

jest.mock('@/app/services/database/purchasesService', () => ({
  purchasesService: {
    checkLessonAccess: jest.fn(),
    createPurchase: jest.fn()
  }
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => {
    return {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: 'test-session-id',
            url: 'https://checkout.stripe.com/test-session',
            payment_status: 'unpaid',
            metadata: { lessonId: 'test-lesson-id', userId: 'test-user-id' },
            client_reference_id: 'lesson_test-lesson-id_user_test-user-id'
          })
        }
      }
    };
  });
});

describe('Purchase API', () => {
  const mockLessonId = 'test-lesson-id';
  const mockPrice = 19.99;
  const mockUserId = 'test-user-id';
  
  let mockRequest: NextRequest;
  let mockSupabaseClient: any;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set environment variables
    process.env.STRIPE_SECRET_KEY = 'test-stripe-key';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
    
    // Create a mock request using Request first, then NextRequest
    const request = new Request(
      'http://localhost:3000/api/lessons/purchase',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    mockRequest = NextRequest.from(request);
    
    // Mock request.json
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      lessonId: mockLessonId,
      price: mockPrice
    });
    
    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: mockUserId
              }
            }
          }
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: mockLessonId,
            title: 'Test Lesson',
            price: mockPrice,
            creator_id: 'creator-id'
          },
          error: null
        })
      })
    };
    
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    
    // Mock purchases service
    (purchasesService.checkLessonAccess as jest.Mock).mockResolvedValue({
      data: {
        hasAccess: false
      },
      error: null
    });
    
    (purchasesService.createPurchase as jest.Mock).mockResolvedValue({
      data: { id: 'new-purchase-id' },
      error: null
    });
  });
  
  it('should return 400 if required fields are missing', async () => {
    // Mock missing fields
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      price: mockPrice
      // lessonId missing
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Missing required fields' });
  });
  
  it('should return 401 if user is not authenticated', async () => {
    // Mock no session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null }
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });
  
  it('should return 404 if lesson is not found', async () => {
    // Mock lesson not found
    mockSupabaseClient.from().single.mockResolvedValue({
      data: null,
      error: { message: 'Lesson not found' }
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Lesson not found' });
  });
  
  it('should return 400 if price does not match', async () => {
    // Mock price mismatch
    mockSupabaseClient.from().single.mockResolvedValue({
      data: {
        id: mockLessonId,
        title: 'Test Lesson',
        price: 29.99, // Different price
        creator_id: 'creator-id'
      },
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Price mismatch' });
  });
  
  it('should return 400 if creator tries to purchase their own lesson', async () => {
    // Mock creator is the same as user
    mockSupabaseClient.from().single.mockResolvedValue({
      data: {
        id: mockLessonId,
        title: 'Test Lesson',
        price: mockPrice,
        creator_id: mockUserId // Same as user ID
      },
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'You cannot purchase your own lesson' });
  });
  
  it('should return 400 if user already has access', async () => {
    // Mock user already has access
    (purchasesService.checkLessonAccess as jest.Mock).mockResolvedValue({
      data: {
        hasAccess: true
      },
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'You already have access to this lesson' });
  });
  
  it('should create Stripe checkout session and return URL', async () => {
    const response = await POST(mockRequest);
    
    // Verify Stripe was called with correct parameters
    const stripeInstance = (Stripe as unknown as jest.Mock).mock.results[0].value;
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Lesson',
              description: 'Access to lesson: Test Lesson',
            },
            unit_amount: 1999, // 19.99 converted to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://example.com/lessons/test-lesson-id?purchase=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/lessons/test-lesson-id?purchase=canceled',
      metadata: {
        lessonId: mockLessonId,
        userId: mockUserId,
      },
      client_reference_id: `lesson_${mockLessonId}_user_${mockUserId}`,
    });
    
    // Verify purchase record was created
    expect(purchasesService.createPurchase).toHaveBeenCalledWith({
      lessonId: mockLessonId,
      userId: mockUserId,
      amount: mockPrice,
      stripeSessionId: 'test-session-id',
    });
    
    // Verify response
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sessionId: 'test-session-id',
      url: 'https://checkout.stripe.com/test-session'
    });
  });
  
  it('should continue even if creating purchase record fails', async () => {
    // Mock purchase creation error
    (purchasesService.createPurchase as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });
    
    const response = await POST(mockRequest);
    
    // Should still return success with session info
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sessionId: 'test-session-id',
      url: 'https://checkout.stripe.com/test-session'
    });
  });
  
  it('should handle Stripe errors', async () => {
    // Mock Stripe error
    const stripeError = new Error('Stripe API error');
    const mockStripeInstance = {
      checkout: {
        sessions: {
          create: jest.fn().mockRejectedValue(stripeError)
        }
      }
    };
    (Stripe as unknown as jest.Mock).mockImplementation(() => mockStripeInstance);
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Failed to create checkout session',
      details: 'Stripe API error'
    });
  });
  
  it('should handle unexpected errors', async () => {
    // Mock unexpected error
    jest.spyOn(mockRequest, 'json').mockRejectedValue(new Error('Unexpected error'));
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Failed to create checkout session',
      details: 'Unexpected error'
    });
  });
});
