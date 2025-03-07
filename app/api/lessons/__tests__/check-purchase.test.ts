import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../check-purchase/route';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { purchasesService } from '@/app/services/database/purchasesService';

// Mock dependencies
jest.mock('@/app/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn()
}));

jest.mock('@/app/services/database/purchasesService', () => ({
  purchasesService: {
    checkLessonAccess: jest.fn(),
    verifyStripeSession: jest.fn(),
    updatePurchaseStatus: jest.fn(),
    createPurchase: jest.fn()
  }
}));

describe('Check Purchase API', () => {
  const mockLessonId = 'test-lesson-id';
  const mockSessionId = 'test-session-id';
  const mockUserId = 'test-user-id';
  
  let mockRequest: NextRequest;
  let mockSupabaseClient: any;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = new NextRequest(
      'http://localhost:3000/api/lessons/check-purchase',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Mock request.json
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      lessonId: mockLessonId,
      sessionId: mockSessionId
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
        filter: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    };
    
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    
    // Mock purchases service
    (purchasesService.checkLessonAccess as jest.Mock).mockResolvedValue({
      data: {
        hasAccess: false,
        purchaseStatus: 'none'
      },
      error: null
    });
    
    (purchasesService.verifyStripeSession as jest.Mock).mockResolvedValue({
      data: {
        isPaid: false,
        amount: 0
      },
      error: null
    });
    
    (purchasesService.updatePurchaseStatus as jest.Mock).mockResolvedValue({
      data: null,
      error: null
    });
    
    (purchasesService.createPurchase as jest.Mock).mockResolvedValue({
      data: { id: 'new-purchase-id' },
      error: null
    });
  });
  
  it('should return 400 if lessonId is missing', async () => {
    // Mock missing lessonId
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      sessionId: mockSessionId
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
  
  it('should return hasAccess=true if user already has access', async () => {
    // Mock user has access
    (purchasesService.checkLessonAccess as jest.Mock).mockResolvedValue({
      data: {
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: '2025-01-01T00:00:00Z'
      },
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasAccess: true,
      purchaseStatus: 'completed',
      purchaseDate: '2025-01-01T00:00:00Z'
    });
  });
  
  it('should return 500 if checkLessonAccess fails', async () => {
    // Mock access check error
    (purchasesService.checkLessonAccess as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to check lesson access' });
  });
  
  it('should verify with Stripe and create purchase if session is paid', async () => {
    // Mock Stripe verification success
    (purchasesService.verifyStripeSession as jest.Mock).mockResolvedValue({
      data: {
        isPaid: true,
        amount: 19.99
      },
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(purchasesService.verifyStripeSession).toHaveBeenCalledWith(mockSessionId);
    expect(purchasesService.createPurchase).toHaveBeenCalledWith({
      lessonId: mockLessonId,
      userId: mockUserId,
      amount: 19.99,
      stripeSessionId: mockSessionId,
      fromWebhook: false
    });
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasAccess: true,
      purchaseStatus: 'completed',
      purchaseDate: expect.any(String),
      message: 'Access granted based on Stripe verification'
    });
  });
  
  it('should check for pending purchases if no session ID provided', async () => {
    // Mock request with no sessionId
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      lessonId: mockLessonId
    });
    
    // Mock pending purchase
    mockSupabaseClient.from().limit.mockResolvedValue({
      data: [{
        id: 'pending-purchase-id',
        status: 'pending',
        stripe_session_id: 'existing-session-id',
        created_at: '2025-01-01T00:00:00Z'
      }],
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('purchases');
    expect(mockSupabaseClient.from().select).toHaveBeenCalled();
    expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('lesson_id', mockLessonId);
    
    // Should try to verify the pending purchase
    expect(purchasesService.verifyStripeSession).toHaveBeenCalledWith('existing-session-id');
  });
  
  it('should update pending purchase to completed if Stripe verification succeeds', async () => {
    // Mock pending purchase
    mockSupabaseClient.from().limit.mockResolvedValue({
      data: [{
        id: 'pending-purchase-id',
        status: 'pending',
        stripe_session_id: 'existing-session-id',
        created_at: '2025-01-01T00:00:00Z'
      }],
      error: null
    });
    
    // Mock Stripe verification success
    (purchasesService.verifyStripeSession as jest.Mock).mockResolvedValue({
      data: {
        isPaid: true,
        amount: 19.99
      },
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(purchasesService.updatePurchaseStatus).toHaveBeenCalledWith(
      'existing-session-id',
      'completed'
    );
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasAccess: true,
      purchaseStatus: 'completed',
      purchaseDate: '2025-01-01T00:00:00Z',
      message: 'Purchase status updated to completed based on Stripe verification'
    });
  });
  
  it('should grant access for recent purchases even if update fails', async () => {
    // Mock recent pending purchase (within 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 4);
    
    mockSupabaseClient.from().limit.mockResolvedValue({
      data: [{
        id: 'pending-purchase-id',
        status: 'pending',
        stripe_session_id: 'existing-session-id',
        created_at: fiveMinutesAgo.toISOString()
      }],
      error: null
    });
    
    // Mock update error
    (purchasesService.updatePurchaseStatus as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Update error')
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasAccess: true,
      purchaseStatus: 'completed',
      purchaseDate: fiveMinutesAgo.toISOString(),
      message: 'Access granted based on recent purchase'
    });
  });
  
  it('should return hasAccess=false for older pending purchases if update fails', async () => {
    // Mock older pending purchase (more than 5 minutes ago)
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    mockSupabaseClient.from().limit.mockResolvedValue({
      data: [{
        id: 'pending-purchase-id',
        status: 'pending',
        stripe_session_id: 'existing-session-id',
        created_at: tenMinutesAgo.toISOString()
      }],
      error: null
    });
    
    // Mock update error
    (purchasesService.updatePurchaseStatus as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Update error')
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasAccess: false,
      purchaseStatus: 'pending',
      message: 'Purchase is still pending'
    });
  });
  
  it('should return hasAccess=false if no purchases found', async () => {
    // Mock no purchases found
    mockSupabaseClient.from().limit.mockResolvedValue({
      data: [],
      error: null
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasAccess: false,
      purchaseStatus: 'none'
    });
  });
  
  it('should return 500 if fetching purchases fails', async () => {
    // Mock database error
    mockSupabaseClient.from().limit.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to check purchases' });
  });
  
  it('should handle unexpected errors', async () => {
    // Mock unexpected error
    jest.spyOn(mockRequest, 'json').mockRejectedValue(new Error('Unexpected error'));
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
});
