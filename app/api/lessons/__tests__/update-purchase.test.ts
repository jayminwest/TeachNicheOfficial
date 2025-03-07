import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../update-purchase/route';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

// Mock dependencies
jest.mock('@/app/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn()
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data: unknown, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(data), init);
      Object.defineProperty(response, 'status', {
        get() {
          return init?.status || 200;
        }
      });
      Object.defineProperty(response, 'json', {
        value: jest.fn().mockResolvedValue(data)
      });
      return response;
    })
  }
}));

describe('Update Purchase API', () => {
  const mockLessonId = 'test-lesson-id';
  const mockSessionId = 'test-session-id';
  const mockPaymentIntentId = 'test-payment-intent-id';
  const mockUserId = 'test-user-id';
  
  let mockRequest: NextRequest;
  let mockSupabaseClient: any;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock crypto.randomUUID
    if (!global.crypto) {
      global.crypto = {} as Crypto;
    }
    global.crypto.randomUUID = jest.fn().mockReturnValue('generated-uuid');
    
    // Create a mock request
    mockRequest = new Request(
      'http://localhost:3000/api/lessons/update-purchase',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ) as unknown as NextRequest;
    
    // Mock request.json
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      lessonId: mockLessonId,
      sessionId: mockSessionId,
      paymentIntentId: mockPaymentIntentId
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
            price: 19.99,
            creator_id: 'creator-id'
          },
          error: null
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis()
      })
    };
    
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });
  
  it('should return 400 if required fields are missing', async () => {
    // Mock missing fields
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      // lessonId missing
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
  
  it('should create a new purchase if none exists', async () => {
    // Mock no existing purchases
    mockSupabaseClient.from().select.mockReturnThis();
    mockSupabaseClient.from().select().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq().eq.mockResolvedValue({
      data: [],
      error: null
    });
    
    // Mock lesson fetch
    mockSupabaseClient.from().select().single.mockResolvedValue({
      data: {
        price: 19.99,
        creator_id: 'creator-id'
      },
      error: null
    });
    
    // Mock insert
    mockSupabaseClient.from().insert.mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-purchase-id' },
          error: null
        })
      };
    });
    
    const response = await POST(mockRequest);
    
    // Verify purchase was created
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('purchases');
    
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'Purchase created successfully',
      purchaseId: 'new-purchase-id'
    });
  });
  
  it('should return 500 if fetching lesson fails', async () => {
    // Mock no existing purchases
    mockSupabaseClient.from().select.mockReturnThis();
    mockSupabaseClient.from().select().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq().eq.mockResolvedValue({
      data: [],
      error: null
    });
    
    // Mock lesson fetch error
    mockSupabaseClient.from().select().single.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
  
  it('should return 500 if creating purchase fails', async () => {
    // Mock no existing purchases
    mockSupabaseClient.from().select.mockReturnThis();
    mockSupabaseClient.from().select().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq().eq.mockResolvedValue({
      data: [],
      error: null
    });
    
    // Mock lesson fetch success
    mockSupabaseClient.from().select().single.mockResolvedValue({
      data: {
        price: 19.99,
        creator_id: 'creator-id'
      },
      error: null
    });
    
    // Mock insert error
    mockSupabaseClient.from().insert.mockImplementation(() => {
      return {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Insert error')
          })
        })
      };
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
  
  it('should update existing purchase if not completed', async () => {
    // Mock existing pending purchase
    mockSupabaseClient.from().select.mockReturnThis();
    mockSupabaseClient.from().select().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq().eq.mockResolvedValue({
      data: [{
        id: 'existing-purchase-id',
        status: 'pending'
      }],
      error: null
    });
    
    // Mock update
    mockSupabaseClient.from().update.mockImplementation(() => {
      return {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'existing-purchase-id' },
          error: null
        })
      };
    });
    
    const response = await POST(mockRequest);
    
    // Verify purchase was updated
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('purchases');
    
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'Purchase updated successfully',
      purchaseId: 'existing-purchase-id'
    });
  });
  
  it('should return 500 if updating purchase fails', async () => {
    // Mock existing pending purchase
    mockSupabaseClient.from().select.mockReturnThis();
    mockSupabaseClient.from().select().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq().eq.mockResolvedValue({
      data: [{
        id: 'existing-purchase-id',
        status: 'pending'
      }],
      error: null
    });
    
    // Mock update error
    mockSupabaseClient.from().update.mockImplementation(() => {
      return {
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Update error')
            })
          })
        })
      };
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
  
  it('should return success if purchase is already completed', async () => {
    // Mock existing completed purchase
    mockSupabaseClient.from().select.mockReturnThis();
    mockSupabaseClient.from().select().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq().eq.mockResolvedValue({
      data: [{
        id: 'existing-purchase-id',
        status: 'completed'
      }],
      error: null
    });
    
    // Ensure from() is properly mocked for the test
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    });
    
    const response = await POST(mockRequest);
    
    // Should not attempt to update
    expect(mockSupabaseClient.from().update).not.toHaveBeenCalled();
    
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: 'Purchase already completed',
      purchaseId: 'existing-purchase-id'
    });
  });
  
  it('should return 500 if fetching purchases fails', async () => {
    // Mock fetch error
    mockSupabaseClient.from().select.mockReturnThis();
    mockSupabaseClient.from().select().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq.mockReturnThis();
    mockSupabaseClient.from().select().eq().eq().eq.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
  
  it('should handle unexpected errors', async () => {
    // Mock unexpected error
    jest.spyOn(mockRequest, 'json').mockRejectedValue(new Error('Unexpected error'));
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
});
