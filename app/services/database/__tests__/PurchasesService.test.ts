import { PurchasesService, PurchaseCreateData } from '../PurchasesService';
import { PostgrestError } from '@supabase/supabase-js';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn();
});

// Mock Supabase client
jest.mock('@/app/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn()
}));

describe('PurchasesService', () => {
  let service: PurchasesService;
  let mockSupabase: {
    from: jest.Mock;
  };
  let mockStripe: {
    checkout: {
      sessions: {
        retrieve: jest.Mock;
      }
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Supabase mock with proper chaining
    interface MockChain {
      select: jest.Mock;
      insert: jest.Mock;
      update: jest.Mock;
      eq: jest.Mock;
      order: jest.Mock;
      limit: jest.Mock;
      single: jest.Mock;
      [key: string]: jest.Mock;
    }
    
    const createMockChain = (): MockChain => {
      const mockChain: MockChain = {
        select: jest.fn().mockReturnValue(mockChain),
        insert: jest.fn().mockReturnValue(mockChain),
        update: jest.fn().mockReturnValue(mockChain),
        eq: jest.fn().mockReturnValue(mockChain),
        order: jest.fn().mockReturnValue(mockChain),
        limit: jest.fn().mockReturnValue(mockChain),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      };
      return mockChain;
    };
    
    mockSupabase = {
      from: jest.fn().mockImplementation(() => createMockChain())
    };
    
    jest.requireMock('@/app/lib/supabase/client').createClientSupabaseClient.mockReturnValue(mockSupabase);
    
    // Create service instance first
    service = new PurchasesService();
    
    // Setup Stripe mock directly
    mockStripe = {
      checkout: {
        sessions: {
          retrieve: jest.fn()
        }
      }
    };
    
    // Directly set the mock on the service instance
    // @ts-expect-error - accessing protected method for testing
    service.getStripe = jest.fn().mockResolvedValue(mockStripe);
  });

  describe('verifyStripeSession', () => {
    it('should return isPaid true when session is paid', async () => {
      // Setup mock response
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        payment_status: 'paid',
        amount_total: 1999,
        metadata: {
          lessonId: 'lesson-123',
          userId: 'user-456'
        }
      });
      
      const result = await service.verifyStripeSession('session-123');
      
      expect(result).toEqual({
        data: {
          isPaid: true,
          amount: 19.99,
          lessonId: 'lesson-123',
          userId: 'user-456'
        },
        error: null,
        success: true
      });
      
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        'session-123',
        { expand: ['line_items', 'payment_intent'] }
      );
    });
    
    it('should return isPaid true when payment_status is no_payment_required', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        payment_status: 'no_payment_required',
        amount_total: 0,
        metadata: {
          lessonId: 'lesson-123',
          userId: 'user-456'
        }
      });
      
      const result = await service.verifyStripeSession('session-123');
      
      expect(result.data?.isPaid).toBe(true);
    });
    
    it('should extract IDs from client_reference_id if metadata is missing', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        payment_status: 'paid',
        amount_total: 1999,
        client_reference_id: 'lesson_abc123_user_xyz789',
        metadata: {}
      });
      
      const result = await service.verifyStripeSession('session-123');
      
      expect(result.data).toEqual({
        isPaid: true,
        amount: 19.99,
        lessonId: 'abc123',
        userId: 'xyz789'
      });
    });
    
    it('should handle Stripe API errors', async () => {
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(new Error('Stripe API error'));
      
      const result = await service.verifyStripeSession('session-123');
      
      expect(result).toEqual({
        data: null,
        error: expect.any(Error),
        success: false
      });
      // The formatError method wraps the original error with context
      expect(result.error?.message).toContain('Stripe API error');
    });
    
    it('should handle session not found', async () => {
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(null);
      
      const result = await service.verifyStripeSession('session-123');
      
      expect(result).toEqual({
        data: null,
        error: expect.any(Error),
        success: false
      });
    });
  });

  describe('checkLessonAccess', () => {
    it('should return hasAccess true for free lessons', async () => {
      // Setup the mock chain for this specific test
      const mockChain: MockChain = {
        select: jest.fn().mockReturnValue(mockChain),
        eq: jest.fn().mockReturnValue(mockChain),
        single: jest.fn().mockResolvedValue({
          data: { price: 0, creator_id: 'creator-123' },
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      mockSupabase.from.mockImplementationOnce(() => mockChain);
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result).toEqual({
        data: {
          hasAccess: true,
          purchaseStatus: 'none'
        },
        error: null,
        success: true
      });
    });
    
    it('should return hasAccess true if user is the creator', async () => {
      // Setup the mock chain for this specific test
      const mockChain: MockChain = {
        select: jest.fn().mockReturnValue(mockChain),
        eq: jest.fn().mockReturnValue(mockChain),
        single: jest.fn().mockResolvedValue({
          data: { price: 9.99, creator_id: 'user-123' },
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      mockSupabase.from.mockImplementationOnce(() => mockChain);
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data?.hasAccess).toBe(true);
    });
    
    it('should return hasAccess true if user has completed purchase', async () => {
      // Setup the mock chain for lesson query
      const mockLessonChain: any = {};
      mockLessonChain.select = jest.fn().mockReturnValue(mockLessonChain);
      mockLessonChain.eq = jest.fn().mockReturnValue(mockLessonChain);
      mockLessonChain.single = jest.fn().mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // Setup the mock chain for purchase query
      const mockPurchaseChain: MockChain = {
        select: jest.fn().mockReturnValue(mockPurchaseChain),
        eq: jest.fn().mockReturnValue(mockPurchaseChain),
        order: jest.fn().mockReturnValue(mockPurchaseChain),
        limit: jest.fn().mockResolvedValue({
          data: [{ status: 'completed', created_at: '2023-01-01T00:00:00Z' }],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        single: jest.fn()
      };
      
      // First call to from() for lesson
      mockSupabase.from.mockImplementationOnce(() => mockLessonChain);
      
      // Second call to from() for purchases
      mockSupabase.from.mockImplementationOnce(() => mockPurchaseChain);
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data).toEqual({
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: '2023-01-01T00:00:00Z'
      });
    });
    
    it('should return hasAccess false if purchase status is not completed', async () => {
      // Setup the mock chain for lesson query
      const mockLessonChain: MockChain = {
        select: jest.fn().mockReturnValue(mockLessonChain),
        eq: jest.fn().mockReturnValue(mockLessonChain),
        single: jest.fn().mockResolvedValue({
          data: { price: 9.99, creator_id: 'creator-123' },
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      // Setup the mock chain for purchase query
      const mockPurchaseChain: MockChain = {
        select: jest.fn().mockReturnValue(mockPurchaseChain),
        eq: jest.fn().mockReturnValue(mockPurchaseChain),
        order: jest.fn().mockReturnValue(mockPurchaseChain),
        limit: jest.fn().mockResolvedValue({
          data: [{ status: 'pending', created_at: '2023-01-01T00:00:00Z' }],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        single: jest.fn()
      };
      
      // First call to from() for lesson
      mockSupabase.from.mockImplementationOnce(() => mockLessonChain);
      
      // Second call to from() for purchases
      mockSupabase.from.mockImplementationOnce(() => mockPurchaseChain);
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data).toEqual({
        hasAccess: false,
        purchaseStatus: 'pending',
        purchaseDate: '2023-01-01T00:00:00Z'
      });
    });
    
    it('should return hasAccess false if user has no purchase', async () => {
      // Setup the mock chain for lesson query
      const mockLessonChain: any = {};
      mockLessonChain.select = jest.fn().mockReturnValue(mockLessonChain);
      mockLessonChain.eq = jest.fn().mockReturnValue(mockLessonChain);
      mockLessonChain.single = jest.fn().mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // Setup the mock chain for purchase query
      const mockPurchaseChain: any = {};
      mockPurchaseChain.select = jest.fn().mockReturnValue(mockPurchaseChain);
      mockPurchaseChain.eq = jest.fn().mockReturnValue(mockPurchaseChain);
      mockPurchaseChain.order = jest.fn().mockReturnValue(mockPurchaseChain);
      mockPurchaseChain.limit = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // First call to from() for lesson
      mockSupabase.from.mockImplementationOnce(() => mockLessonChain);
      
      // Second call to from() for purchases
      mockSupabase.from.mockImplementationOnce(() => mockPurchaseChain);
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data).toEqual({
        hasAccess: false,
        purchaseStatus: 'none'
      });
    });
    
    it('should handle database errors when fetching lesson', async () => {
      const mockError: PostgrestError = {
        message: 'Database error',
        details: '',
        hint: '',
        code: 'ERROR'
      };
      
      // Create a mock chain for this specific test
      const mockLessonChain: MockChain = {
        select: jest.fn().mockReturnValue(mockLessonChain),
        eq: jest.fn().mockReturnValue(mockLessonChain),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      // Override the default mock for this test
      mockSupabase.from.mockImplementationOnce(() => mockLessonChain);
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Error fetching lesson');
    });
  });

  describe('createPurchase', () => {
    const purchaseData: PurchaseCreateData = {
      lessonId: 'lesson-123',
      userId: 'user-123',
      amount: 19.99,
      stripeSessionId: 'session-123'
    };
    
    it('should return existing completed purchase if one exists', async () => {
      // Setup mock for existing purchase query
      const mockPurchaseChain: MockChain = {
        select: jest.fn().mockReturnValue(mockPurchaseChain),
        eq: jest.fn().mockReturnValue(mockPurchaseChain),
        order: jest.fn().mockReturnValue(mockPurchaseChain),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'purchase-123', status: 'completed' }],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        single: jest.fn()
      };
      
      mockSupabase.from.mockImplementationOnce(() => mockPurchaseChain);
      
      const result = await service.createPurchase(purchaseData);
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      // Should not try to create a new purchase
      expect(mockPurchaseChain.insert).not.toHaveBeenCalled();
    });
    
    it('should update existing purchase if it exists with same session ID but not completed', async () => {
      // Setup mocks for the different queries
      
      // First query - no existing purchase for user/lesson
      const mockUserLessonChain: MockChain = {
        select: jest.fn().mockReturnValue(mockUserLessonChain),
        eq: jest.fn().mockReturnValue(mockUserLessonChain),
        order: jest.fn().mockReturnValue(mockUserLessonChain),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        single: jest.fn()
      };
      
      // Second query - existing purchase with same session ID
      const mockSessionChain: MockChain = {
        select: jest.fn().mockReturnValue(mockSessionChain),
        eq: jest.fn().mockReturnValue(mockSessionChain),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'purchase-123', status: 'pending' }],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // Update query
      const mockUpdateChain: MockChain = {
        update: jest.fn().mockReturnValue(mockUpdateChain),
        eq: jest.fn().mockReturnValue(mockUpdateChain),
        select: jest.fn().mockReturnValue(mockUpdateChain),
        single: jest.fn().mockResolvedValue({
          data: { id: 'purchase-123' },
          error: null
        }),
        insert: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      // First from() call for user/lesson purchase
      mockSupabase.from.mockImplementationOnce(() => mockUserLessonChain);
      
      // Second from() call for session ID purchase
      mockSupabase.from.mockImplementationOnce(() => mockSessionChain);
      
      // Third from() call for update
      mockSupabase.from.mockImplementationOnce(() => mockUpdateChain);
      
      const result = await service.createPurchase({
        ...purchaseData,
        fromWebhook: true
      });
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
    });
    
    it('should create a new purchase if none exists', async () => {
      // Setup mocks for the different queries
      
      // First query - no existing purchase for user/lesson
      const mockUserLessonChain: MockChain = {
        select: jest.fn().mockReturnValue(mockUserLessonChain),
        eq: jest.fn().mockReturnValue(mockUserLessonChain),
        order: jest.fn().mockReturnValue(mockUserLessonChain),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        single: jest.fn()
      };
      
      // Second query - no existing purchase with same session ID
      const mockSessionChain: MockChain = {
        select: jest.fn().mockReturnValue(mockSessionChain),
        eq: jest.fn().mockReturnValue(mockSessionChain),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // Lesson data query
      const mockLessonChain: MockChain = {
        select: jest.fn().mockReturnValue(mockLessonChain),
        eq: jest.fn().mockReturnValue(mockLessonChain),
        single: jest.fn().mockResolvedValue({
          data: { creator_id: 'creator-123', price: 19.99 },
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      // Insert query
      const mockInsertChain: MockChain = {
        insert: jest.fn().mockReturnValue(mockInsertChain),
        select: jest.fn().mockReturnValue(mockInsertChain),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-purchase-123' },
          error: null
        }),
        eq: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      // First from() call for user/lesson purchase
      mockSupabase.from.mockImplementationOnce(() => mockUserLessonChain);
      
      // Second from() call for session ID purchase
      mockSupabase.from.mockImplementationOnce(() => mockSessionChain);
      
      // Third from() call for lesson data
      mockSupabase.from.mockImplementationOnce(() => mockLessonChain);
      
      // Fourth from() call for insert
      mockSupabase.from.mockImplementationOnce(() => mockInsertChain);
      
      // Mock crypto.randomUUID
      const originalRandomUUID = crypto.randomUUID;
      crypto.randomUUID = jest.fn().mockReturnValue('new-purchase-123');
      
      const result = await service.createPurchase(purchaseData);
      
      expect(result).toEqual({
        data: { id: 'new-purchase-123' },
        error: null,
        success: true
      });
      
      // Restore original function
      crypto.randomUUID = originalRandomUUID;
    });
    
    it('should handle database errors when creating purchase', async () => {
      // Setup mocks for the different queries
      
      // First query - no existing purchase for user/lesson
      const mockUserLessonSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // Second query - no existing purchase with same session ID
      const mockSessionSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // Lesson data query
      const mockLessonSingle = jest.fn().mockResolvedValue({
        data: { creator_id: 'creator-123', price: 19.99 },
        error: null
      });
      
      // Insert error
      const mockError: PostgrestError = {
        message: 'Database error',
        details: '',
        hint: '',
        code: 'ERROR'
      };
      
      const mockInsertSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });
      
      // First from() call for user/lesson purchase
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockImplementation(() => ({
              order: jest.fn().mockImplementation(() => ({
                limit: mockUserLessonSelect
              }))
            }))
          }))
        }))
      }));
      
      // Second from() call for session ID purchase
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            limit: mockSessionSelect
          }))
        }))
      }));
      
      // Third from() call for lesson data
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            single: mockLessonSingle
          }))
        }))
      }));
      
      // Fourth from() call for insert
      mockSupabase.from.mockImplementationOnce(() => ({
        insert: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockImplementation(() => ({
            single: mockInsertSingle
          }))
        }))
      }));
      
      // Mock crypto.randomUUID
      const originalRandomUUID = crypto.randomUUID;
      crypto.randomUUID = jest.fn().mockReturnValue('new-purchase-123');
      
      const result = await service.createPurchase(purchaseData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Restore original function
      crypto.randomUUID = originalRandomUUID;
    });
  });

  describe('updatePurchaseStatus', () => {
    it('should update purchase status when found by stripe_session_id', async () => {
      // Mock finding purchase by session ID
      const mockSessionChain: MockChain = {
        select: jest.fn().mockReturnValue(mockSessionChain),
        eq: jest.fn().mockReturnValue(mockSessionChain),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'purchase-123', status: 'pending' }],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // Mock update result
      const mockUpdateChain: MockChain = {
        update: jest.fn().mockImplementation((data) => {
          expect(data).toEqual({
            status: 'completed',
            updated_at: expect.any(String)
          });
          return mockUpdateChain;
        }),
        eq: jest.fn().mockReturnValue(mockUpdateChain),
        select: jest.fn().mockReturnValue(mockUpdateChain),
        single: jest.fn().mockResolvedValue({
          data: { id: 'purchase-123' },
          error: null
        }),
        insert: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => mockSessionChain);
      
      // Second from() call for update
      mockSupabase.from.mockImplementationOnce(() => mockUpdateChain);
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
    });
    
    it('should try finding purchase by payment_intent_id if not found by session_id', async () => {
      // No purchase found by session ID
      const mockSessionChain: MockChain = {
        select: jest.fn().mockReturnValue(mockSessionChain),
        eq: jest.fn().mockReturnValue(mockSessionChain),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // Purchase found by payment intent ID
      const mockPaymentIntentChain: MockChain = {
        select: jest.fn().mockReturnValue(mockPaymentIntentChain),
        eq: jest.fn().mockImplementation((field, value) => {
          expect(field).toBe('payment_intent_id');
          expect(value).toBe('payment-123');
          return mockPaymentIntentChain;
        }),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'purchase-123', status: 'pending' }],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // Mock update result
      const mockUpdateChain: MockChain = {
        update: jest.fn().mockReturnValue(mockUpdateChain),
        eq: jest.fn().mockReturnValue(mockUpdateChain),
        select: jest.fn().mockReturnValue(mockUpdateChain),
        single: jest.fn().mockResolvedValue({
          data: { id: 'purchase-123' },
          error: null
        }),
        insert: jest.fn(),
        order: jest.fn(),
        limit: jest.fn()
      };
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => mockSessionChain);
      
      // Second from() call for payment intent ID query
      mockSupabase.from.mockImplementationOnce(() => mockPaymentIntentChain);
      
      // Third from() call for update
      mockSupabase.from.mockImplementationOnce(() => mockUpdateChain);
      
      const result = await service.updatePurchaseStatus('payment-123', 'completed');
      
      expect(result.success).toBe(true);
    });
    
    it('should not update if purchase already has the desired status', async () => {
      // Mock finding purchase with status already completed
      const mockSessionChain: MockChain = {
        select: jest.fn().mockReturnValue(mockSessionChain),
        eq: jest.fn().mockReturnValue(mockSessionChain),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'purchase-123', status: 'completed' }],
          error: null
        }),
        update: jest.fn(),
        insert: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => mockSessionChain);
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      // Should not try to update
      expect(mockSessionChain.update).not.toHaveBeenCalled();
    });
    
    it('should return error if purchase not found', async () => {
      // No purchase found by session ID
      const mockSessionChain: MockChain = {
        select: jest.fn().mockReturnValue(mockSessionChain),
        eq: jest.fn().mockReturnValue(mockSessionChain),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // No purchase found by payment intent ID
      const mockPaymentIntentChain: MockChain = {
        select: jest.fn().mockReturnValue(mockPaymentIntentChain),
        eq: jest.fn().mockReturnValue(mockPaymentIntentChain),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        order: jest.fn(),
        single: jest.fn()
      };
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => mockSessionChain);
      
      // Second from() call for payment intent ID query
      mockSupabase.from.mockImplementationOnce(() => mockPaymentIntentChain);
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('No purchase found');
    });
  });

  describe('getPurchasesByUserId', () => {
    it('should return formatted purchases for a user', async () => {
      // Mock database response with the actual data structure
      const mockData = [
        {
          id: 'purchase-1',
          lesson_id: 'lesson-1',
          status: 'completed',
          amount: 19.99,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'purchase-2',
          lesson_id: 'lesson-2',
          status: 'pending',
          amount: 29.99,
          created_at: '2023-01-02T00:00:00Z'
        }
      ];
      
      const mockPurchasesChain: MockChain = {
        select: jest.fn().mockReturnValue(mockPurchasesChain),
        eq: jest.fn().mockReturnValue(mockPurchasesChain),
        order: jest.fn().mockResolvedValue({
          data: mockData,
          error: null
        }),
        insert: jest.fn(),
        update: jest.fn(),
        limit: jest.fn(),
        single: jest.fn()
      };
      
      // Setup mock for purchases query
      mockSupabase.from.mockImplementationOnce(() => mockPurchasesChain);
      
      const result = await service.getPurchasesByUserId('user-123');
      
      expect(result).toEqual({
        data: [
          {
            id: 'purchase-1',
            lessonId: 'lesson-1',
            status: 'completed',
            amount: 19.99,
            createdAt: '2023-01-01T00:00:00Z'
          },
          {
            id: 'purchase-2',
            lessonId: 'lesson-2',
            status: 'pending',
            amount: 29.99,
            createdAt: '2023-01-02T00:00:00Z'
          }
        ],
        error: null,
        success: true
      });
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      const mockError: PostgrestError = {
        message: 'Database error',
        details: '',
        hint: '',
        code: 'ERROR'
      };
      
      // Setup mock for purchases query with error
      const mockPurchasesSelect = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });
      
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(mockPurchasesSelect)
          })
        })
      }));
      
      const result = await service.getPurchasesByUserId('user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
