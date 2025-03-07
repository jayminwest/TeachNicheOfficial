import { PurchasesService, PurchaseCreateData } from '../PurchasesService';
import { PostgrestError } from '@supabase/supabase-js';
import { PurchaseStatus } from '@/app/types/purchase';

// Mock Stripe
jest.mock('stripe', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          retrieve: jest.fn()
        }
      }
    }))
  };
});

// Mock Supabase client
jest.mock('@/app/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      execute: jest.fn()
    })
  })
}));

describe('PurchasesService', () => {
  let service: PurchasesService;
  let mockSupabase: any;
  let mockStripe: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        execute: jest.fn()
      })
    };
    
    require('@/app/lib/supabase/client').createClientSupabaseClient.mockReturnValue(mockSupabase);
    
    // Setup Stripe mock
    mockStripe = {
      checkout: {
        sessions: {
          retrieve: jest.fn()
        }
      }
    };
    
    require('stripe').default.mockImplementation(() => mockStripe);
    
    service = new PurchasesService();
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
      expect(result.error?.message).toContain('Error verifying Stripe session');
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
      mockSupabase.from().select().single.mockResolvedValue({
        data: { price: 0, creator_id: 'creator-123' },
        error: null
      });
      
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
      mockSupabase.from().select().single.mockResolvedValue({
        data: { price: 9.99, creator_id: 'user-123' },
        error: null
      });
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data?.hasAccess).toBe(true);
    });
    
    it('should return hasAccess true if user has completed purchase', async () => {
      // Lesson is not free and user is not creator
      mockSupabase.from().select().single.mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // User has a completed purchase
      mockSupabase.from().select().mockResolvedValue({
        data: [{ status: 'completed', created_at: '2023-01-01T00:00:00Z' }],
        error: null
      });
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data).toEqual({
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: '2023-01-01T00:00:00Z'
      });
    });
    
    it('should return hasAccess false if purchase status is not completed', async () => {
      // Lesson is not free and user is not creator
      mockSupabase.from().select().single.mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // User has a pending purchase
      mockSupabase.from().select().mockResolvedValue({
        data: [{ status: 'pending', created_at: '2023-01-01T00:00:00Z' }],
        error: null
      });
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data).toEqual({
        hasAccess: false,
        purchaseStatus: 'pending',
        purchaseDate: '2023-01-01T00:00:00Z'
      });
    });
    
    it('should return hasAccess false if user has no purchase', async () => {
      // Lesson is not free and user is not creator
      mockSupabase.from().select().single.mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // User has no purchase
      mockSupabase.from().select().mockResolvedValue({
        data: [],
        error: null
      });
      
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
      
      mockSupabase.from().select().single.mockResolvedValue({
        data: null,
        error: mockError
      });
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.success).toBe(false);
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
      // Mock existing completed purchase
      mockSupabase.from().select().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'completed' }],
        error: null
      });
      
      const result = await service.createPurchase(purchaseData);
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      // Should not try to create a new purchase
      expect(mockSupabase.from().insert).not.toHaveBeenCalled();
    });
    
    it('should update existing purchase if it exists with same session ID but not completed', async () => {
      // No existing purchase for user/lesson
      mockSupabase.from().select().mockResolvedValueOnce({
        data: [],
        error: null
      });
      
      // Existing purchase with same session ID
      mockSupabase.from().select().mockResolvedValueOnce({
        data: [{ id: 'purchase-123', status: 'pending' }],
        error: null
      });
      
      // Update result
      mockSupabase.from().update().select().single.mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      const result = await service.createPurchase({
        ...purchaseData,
        fromWebhook: true
      });
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      // Should update the existing purchase
      expect(mockSupabase.from().update).toHaveBeenCalled();
    });
    
    it('should create a new purchase if none exists', async () => {
      // No existing purchases
      mockSupabase.from().select().mockResolvedValue({
        data: [],
        error: null
      });
      
      // Lesson data
      mockSupabase.from().select().single.mockResolvedValue({
        data: { creator_id: 'creator-123', price: 19.99 },
        error: null
      });
      
      // Insert result
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'new-purchase-123' },
        error: null
      });
      
      // Mock crypto.randomUUID
      const originalRandomUUID = crypto.randomUUID;
      crypto.randomUUID = jest.fn().mockReturnValue('new-purchase-123');
      
      const result = await service.createPurchase(purchaseData);
      
      expect(result).toEqual({
        data: { id: 'new-purchase-123' },
        error: null,
        success: true
      });
      
      // Should insert a new purchase
      expect(mockSupabase.from().insert).toHaveBeenCalled();
      
      // Restore original function
      crypto.randomUUID = originalRandomUUID;
    });
    
    it('should handle database errors when creating purchase', async () => {
      // No existing purchases
      mockSupabase.from().select().mockResolvedValue({
        data: [],
        error: null
      });
      
      // Lesson data
      mockSupabase.from().select().single.mockResolvedValue({
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
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: mockError
      });
      
      const result = await service.createPurchase(purchaseData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updatePurchaseStatus', () => {
    it('should update purchase status when found by stripe_session_id', async () => {
      // Mock finding purchase by session ID
      mockSupabase.from().select().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'pending' }],
        error: null
      });
      
      // Mock update result
      mockSupabase.from().update().select().single.mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'completed',
        updated_at: expect.any(String)
      });
    });
    
    it('should try finding purchase by payment_intent_id if not found by session_id', async () => {
      // No purchase found by session ID
      mockSupabase.from().select().mockResolvedValueOnce({
        data: [],
        error: null
      });
      
      // Purchase found by payment intent ID
      mockSupabase.from().select().mockResolvedValueOnce({
        data: [{ id: 'purchase-123', status: 'pending' }],
        error: null
      });
      
      // Mock update result
      mockSupabase.from().update().select().single.mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      const result = await service.updatePurchaseStatus('payment-123', 'completed');
      
      expect(result.success).toBe(true);
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('payment_intent_id', 'payment-123');
    });
    
    it('should not update if purchase already has the desired status', async () => {
      // Mock finding purchase with status already completed
      mockSupabase.from().select().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'completed' }],
        error: null
      });
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      // Should not try to update
      expect(mockSupabase.from().update).not.toHaveBeenCalled();
    });
    
    it('should return error if purchase not found', async () => {
      // No purchase found by either method
      mockSupabase.from().select().mockResolvedValue({
        data: [],
        error: null
      });
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('No purchase found');
    });
  });

  describe('getPurchasesByUserId', () => {
    it('should return formatted purchases for a user', async () => {
      // Mock database response
      mockSupabase.from().select().mockResolvedValue({
        data: [
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
        ],
        error: null
      });
      
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
      
      expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      const mockError: PostgrestError = {
        message: 'Database error',
        details: '',
        hint: '',
        code: 'ERROR'
      };
      
      mockSupabase.from().select().mockResolvedValue({
        data: null,
        error: mockError
      });
      
      const result = await service.getPurchasesByUserId('user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
