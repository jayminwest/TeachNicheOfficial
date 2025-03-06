import { purchasesService } from '@/app/services/database/purchasesService';

// Mock Stripe
jest.mock('stripe', () => {
  const mockRetrieve = jest.fn().mockResolvedValue({
    id: 'cs_test_123',
    payment_status: 'paid',
    metadata: {
      lessonId: 'lesson-123',
      userId: 'user-123'
    },
    amount_total: 1000 // in cents
  });
  
  const mockStripe = function() {
    return {
      checkout: {
        sessions: {
          retrieve: mockRetrieve
        }
      }
    };
  };
  
  // Make the mock function and its methods accessible for spying in tests
  mockStripe.mockRetrieveImplementation = mockRetrieve;
  
  return mockStripe;
});

describe('PurchasesService', () => {
  let mockSupabase: {
    from: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    single: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
  };
  let mockStripe: {
    checkout: {
      sessions: {
        retrieve: jest.Mock;
      }
    }
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    
    // Setup Stripe mock
    const mockRetrieve = jest.fn().mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      metadata: {
        lessonId: 'lesson-123',
        userId: 'user-123'
      },
      amount_total: 1000 // in cents
    });
    
    // Create a proper mock Stripe instance
    mockStripe = {
      checkout: {
        sessions: {
          retrieve: mockRetrieve
        }
      }
    };
    
    // Replace the mock implementation
    const stripeMock = jest.requireMock('stripe');
    stripeMock.mockRetrieveImplementation = mockRetrieve;
    
    // Override the purchasesService's getStripe method
    jest.spyOn(purchasesService as any, 'getStripe').mockReturnValue(mockStripe);
    
    // Setup Supabase client mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };
    
    // Mock the getClient method to return our mock
    jest.spyOn(purchasesService as any, 'getClient').mockReturnValue(mockSupabase);
    
    // Setup environment variables
    process.env.STRIPE_SECRET_KEY = 'mock-key';
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('verifyStripeSession', () => {
    it('should verify a paid session correctly', async () => {
      const { data, error } = await purchasesService.verifyStripeSession('cs_test_123');
      
      expect(error).toBeNull();
      expect(data).toEqual({
        isPaid: true,
        amount: 10,
        lessonId: 'lesson-123',
        userId: 'user-123'
      });
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        'cs_test_123',
        { expand: ['line_items', 'payment_intent'] }
      );
    });
    
    it('should extract IDs from client_reference_id if metadata is missing', async () => {
      // Mock a session with missing metadata but valid client_reference_id
      mockStripe.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid',
        metadata: {},
        client_reference_id: 'lesson_lesson-123_user_user-123',
        amount_total: 1000
      });
      
      const { data, error } = await purchasesService.verifyStripeSession('cs_test_123');
      
      expect(error).toBeNull();
      expect(data).toEqual({
        isPaid: true,
        amount: 10,
        lessonId: 'lesson-123',
        userId: 'user-123'
      });
    });
    
    it('should handle unpaid sessions correctly', async () => {
      // Mock an unpaid session
      const stripeMock = jest.requireMock('stripe');
      stripeMock.mockRetrieveImplementation.mockResolvedValueOnce({
        id: 'cs_test_123',
        payment_status: 'unpaid',
        metadata: {
          lessonId: 'lesson-123',
          userId: 'user-123'
        },
        amount_total: 1000
      });
      
      const { data, error } = await purchasesService.verifyStripeSession('cs_test_123');
      
      expect(error).toBeNull();
      expect(data).toEqual({
        isPaid: false,
        amount: 10,
        lessonId: 'lesson-123',
        userId: 'user-123'
      });
    });
    
    it('should handle Stripe API errors', async () => {
      // Mock a Stripe error
      jest.spyOn(purchasesService as any, 'getClient').mockReturnValue(mockSupabase);
      
      // Override the Stripe mock for this test
      const stripeMock = jest.requireMock('stripe');
      stripeMock.mockRetrieveImplementation.mockRejectedValueOnce(
        new Error('Invalid session ID')
      );
      
      const { data, error } = await purchasesService.verifyStripeSession('invalid-id');
      
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Error verifying Stripe session');
    });
  });
  
  describe('createPurchase', () => {
    it('should create a new purchase record', async () => {
      // Mock lesson lookup
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          creator_id: 'creator-123',
          price: 10
        },
        error: null
      });
      
      // Mock no existing purchases
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [],
        error: null
      });
      
      // Mock successful insert
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      const { data, error } = await purchasesService.createPurchase({
        lessonId: 'lesson-123',
        userId: 'user-123',
        amount: 10,
        stripeSessionId: 'cs_test_123'
      });
      
      expect(error).toBeNull();
      expect(data).toEqual({ id: 'purchase-123' });
      expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
    
    it('should return existing completed purchase if found', async () => {
      // Mock existing completed purchase
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [{
          id: 'purchase-123',
          status: 'completed',
          stripe_session_id: 'cs_test_previous'
        }],
        error: null
      });
      
      const { data, error } = await purchasesService.createPurchase({
        lessonId: 'lesson-123',
        userId: 'user-123',
        amount: 10,
        stripeSessionId: 'cs_test_123'
      });
      
      expect(error).toBeNull();
      expect(data).toEqual({ id: 'purchase-123' });
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });
    
    it('should update existing purchase with same session ID if from webhook', async () => {
      // Mock no existing user-lesson purchase
      mockSupabase.from().select().eq().order().limit.mockResolvedValueOnce({
        data: [],
        error: null
      });
      
      // Mock existing session purchase
      mockSupabase.from().select().eq().limit.mockResolvedValueOnce({
        data: [{
          id: 'purchase-123',
          status: 'pending'
        }],
        error: null
      });
      
      // Mock successful update
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      const { data, error } = await purchasesService.createPurchase({
        lessonId: 'lesson-123',
        userId: 'user-123',
        amount: 10,
        stripeSessionId: 'cs_test_123',
        fromWebhook: true
      });
      
      expect(error).toBeNull();
      expect(data).toEqual({ id: 'purchase-123' });
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock lesson lookup error
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Lesson not found')
      });
      
      const { data, error } = await purchasesService.createPurchase({
        lessonId: 'lesson-123',
        userId: 'user-123',
        amount: 10,
        stripeSessionId: 'cs_test_123'
      });
      
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Lesson not found');
    });
  });
  
  describe('updatePurchaseStatus', () => {
    it('should update purchase status by session ID', async () => {
      // Mock existing purchase
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [{
          id: 'purchase-123',
          status: 'pending'
        }],
        error: null
      });
      
      // Mock successful update
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      const { data, error } = await purchasesService.updatePurchaseStatus(
        'cs_test_123',
        'completed'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({ id: 'purchase-123' });
      expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'completed',
        updated_at: expect.any(String)
      });
    });
    
    it('should try payment_intent_id if session_id not found', async () => {
      // Mock no purchase found by session ID
      mockSupabase.from().select().eq().limit.mockResolvedValueOnce({
        data: [],
        error: null
      });
      
      // Mock purchase found by payment intent ID
      mockSupabase.from().select().eq().limit.mockResolvedValueOnce({
        data: [{
          id: 'purchase-123',
          status: 'pending'
        }],
        error: null
      });
      
      // Mock successful update
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      const { data, error } = await purchasesService.updatePurchaseStatus(
        'pi_test_123',
        'completed'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({ id: 'purchase-123' });
      expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
      expect(mockSupabase.eq).toHaveBeenCalledWith('payment_intent_id', 'pi_test_123');
      expect(mockSupabase.update).toHaveBeenCalled();
    });
    
    it('should return error if no purchase found', async () => {
      // Mock no purchase found by either ID
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [],
        error: null
      });
      
      const { data, error } = await purchasesService.updatePurchaseStatus(
        'cs_test_123',
        'completed'
      );
      
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('No purchase found');
    });
    
    it('should not update if purchase already has the desired status', async () => {
      // Mock existing purchase with same status
      mockSupabase.from().select().eq().limit.mockResolvedValue({
        data: [{
          id: 'purchase-123',
          status: 'completed'
        }],
        error: null
      });
      
      const { data, error } = await purchasesService.updatePurchaseStatus(
        'cs_test_123',
        'completed'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({ id: 'purchase-123' });
      expect(mockSupabase.update).not.toHaveBeenCalled();
    });
  });
  
  describe('checkLessonAccess', () => {
    it('should grant access for free lessons', async () => {
      // Mock a free lesson
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          price: 0,
          creator_id: 'creator-123'
        },
        error: null
      });
      
      const { data, error } = await purchasesService.checkLessonAccess(
        'user-123',
        'lesson-123'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({
        hasAccess: true,
        purchaseStatus: 'none'
      });
    });
    
    it('should grant access for lesson creators', async () => {
      // Mock a paid lesson where user is creator
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          price: 10,
          creator_id: 'user-123'
        },
        error: null
      });
      
      const { data, error } = await purchasesService.checkLessonAccess(
        'user-123',
        'lesson-123'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({
        hasAccess: true,
        purchaseStatus: 'none'
      });
    });
    
    it('should grant access for completed purchases', async () => {
      // Mock a paid lesson
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          price: 10,
          creator_id: 'creator-123'
        },
        error: null
      });
      
      // Mock a completed purchase
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [{
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z'
        }],
        error: null
      });
      
      const { data, error } = await purchasesService.checkLessonAccess(
        'user-123',
        'lesson-123'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: '2025-01-01T00:00:00Z'
      });
    });
    
    it('should deny access for pending purchases', async () => {
      // Mock a paid lesson
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          price: 10,
          creator_id: 'creator-123'
        },
        error: null
      });
      
      // Mock a pending purchase
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [{
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z'
        }],
        error: null
      });
      
      const { data, error } = await purchasesService.checkLessonAccess(
        'user-123',
        'lesson-123'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({
        hasAccess: false,
        purchaseStatus: 'pending',
        purchaseDate: '2025-01-01T00:00:00Z'
      });
    });
    
    it('should deny access when no purchase exists', async () => {
      // Mock a paid lesson
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          price: 10,
          creator_id: 'creator-123'
        },
        error: null
      });
      
      // Mock no purchases
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [],
        error: null
      });
      
      const { data, error } = await purchasesService.checkLessonAccess(
        'user-123',
        'lesson-123'
      );
      
      expect(error).toBeNull();
      expect(data).toEqual({
        hasAccess: false,
        purchaseStatus: 'none'
      });
    });
  });
});
