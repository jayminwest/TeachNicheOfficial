import { PurchasesService, PurchaseCreateData } from '../purchasesService';
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
    mockSupabase = {
      from: jest.fn().mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  eq: jest.fn().mockImplementation(() => {
                    return {
                      order: jest.fn().mockImplementation(() => {
                        return {
                          limit: jest.fn().mockResolvedValue({ data: [], error: null })
                        };
                      })
                    };
                  }),
                  order: jest.fn().mockImplementation(() => {
                    return {
                      limit: jest.fn().mockResolvedValue({ data: [], error: null })
                    };
                  }),
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                };
              }),
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            };
          }),
          insert: jest.fn().mockImplementation(() => {
            return {
              select: jest.fn().mockImplementation(() => {
                return {
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                };
              })
            };
          }),
          update: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  select: jest.fn().mockImplementation(() => {
                    return {
                      single: jest.fn().mockResolvedValue({ data: null, error: null })
                    };
                  })
                };
              })
            };
          })
        };
      })
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
    // @ts-expect-error - accessing private method for testing
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
      // Setup the mock chain for this specific test
      const mockSingle = jest.fn().mockResolvedValue({
        data: { price: 0, creator_id: 'creator-123' },
        error: null
      });
      
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            single: mockSingle
          }))
        }))
      }));
      
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
      const mockSingle = jest.fn().mockResolvedValue({
        data: { price: 9.99, creator_id: 'user-123' },
        error: null
      });
      
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            single: mockSingle
          }))
        }))
      }));
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data?.hasAccess).toBe(true);
    });
    
    it('should return hasAccess true if user has completed purchase', async () => {
      // Setup the mock chain for lesson query
      const mockLessonSingle = jest.fn().mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // Setup the mock chain for purchase query
      const mockPurchaseSelect = jest.fn().mockResolvedValue({
        data: [{ status: 'completed', created_at: '2023-01-01T00:00:00Z' }],
        error: null
      });
      
      // First call to from() for lesson
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            single: mockLessonSingle
          }))
        }))
      }));
      
      // Second call to from() for purchases
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockImplementation(() => ({
              order: jest.fn().mockImplementation(() => ({
                limit: mockPurchaseSelect
              }))
            }))
          }))
        }))
      }));
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data).toEqual({
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: '2023-01-01T00:00:00Z'
      });
    });
    
    it('should return hasAccess false if purchase status is not completed', async () => {
      // Setup the mock chain for lesson query
      const mockLessonSingle = jest.fn().mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // Setup the mock chain for purchase query
      const mockPurchaseSelect = jest.fn().mockResolvedValue({
        data: [{ status: 'pending', created_at: '2023-01-01T00:00:00Z' }],
        error: null
      });
      
      // First call to from() for lesson
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            single: mockLessonSingle
          }))
        }))
      }));
      
      // Second call to from() for purchases
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockImplementation(() => ({
              order: jest.fn().mockImplementation(() => ({
                limit: mockPurchaseSelect
              }))
            }))
          }))
        }))
      }));
      
      const result = await service.checkLessonAccess('user-123', 'lesson-123');
      
      expect(result.data).toEqual({
        hasAccess: false,
        purchaseStatus: 'pending',
        purchaseDate: '2023-01-01T00:00:00Z'
      });
    });
    
    it('should return hasAccess false if user has no purchase', async () => {
      // Setup the mock chain for lesson query
      const mockLessonSingle = jest.fn().mockResolvedValue({
        data: { price: 9.99, creator_id: 'creator-123' },
        error: null
      });
      
      // Setup the mock chain for purchase query
      const mockPurchaseSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // First call to from() for lesson
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            single: mockLessonSingle
          }))
        }))
      }));
      
      // Second call to from() for purchases
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockImplementation(() => ({
              order: jest.fn().mockImplementation(() => ({
                limit: mockPurchaseSelect
              }))
            }))
          }))
        }))
      }));
      
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
      // Setup mock for existing purchase query
      const mockPurchaseSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'completed' }],
        error: null
      });
      
      const mockInsert = jest.fn();
      
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockImplementation(() => ({
              order: jest.fn().mockImplementation(() => ({
                limit: mockPurchaseSelect
              }))
            }))
          }))
        })),
        insert: mockInsert
      }));
      
      const result = await service.createPurchase(purchaseData);
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      // Should not try to create a new purchase
      expect(mockInsert).not.toHaveBeenCalled();
    });
    
    it('should update existing purchase if it exists with same session ID but not completed', async () => {
      // Setup mocks for the different queries
      
      // First query - no existing purchase for user/lesson
      const mockUserLessonSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // Second query - existing purchase with same session ID
      const mockSessionSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'pending' }],
        error: null
      });
      
      // Update query
      const mockUpdateSingle = jest.fn().mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
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
      
      // Third from() call for update
      mockSupabase.from.mockImplementationOnce(() => ({
        update: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            select: jest.fn().mockImplementation(() => ({
              single: mockUpdateSingle
            }))
          }))
        }))
      }));
      
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
      
      // Insert query
      const mockInsertSingle = jest.fn().mockResolvedValue({
        data: { id: 'new-purchase-123' },
        error: null
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
      const mockSessionSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'pending' }],
        error: null
      });
      
      // Mock update result
      const mockUpdateSingle = jest.fn().mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            limit: mockSessionSelect
          }))
        }))
      }));
      
      // Second from() call for update
      mockSupabase.from.mockImplementationOnce(() => ({
        update: jest.fn().mockImplementation((data) => {
          expect(data).toEqual({
            status: 'completed',
            updated_at: expect.any(String)
          });
          return {
            eq: jest.fn().mockImplementation(() => ({
              select: jest.fn().mockImplementation(() => ({
                single: mockUpdateSingle
              }))
            }))
          };
        })
      }));
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
    });
    
    it('should try finding purchase by payment_intent_id if not found by session_id', async () => {
      // No purchase found by session ID
      const mockSessionSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // Purchase found by payment intent ID
      const mockPaymentIntentSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'pending' }],
        error: null
      });
      
      // Mock update result
      const mockUpdateSingle = jest.fn().mockResolvedValue({
        data: { id: 'purchase-123' },
        error: null
      });
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            limit: mockSessionSelect
          }))
        }))
      }));
      
      // Second from() call for payment intent ID query
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation((field, value) => {
            expect(field).toBe('payment_intent_id');
            expect(value).toBe('payment-123');
            return {
              limit: mockPaymentIntentSelect
            };
          })
        }))
      }));
      
      // Third from() call for update
      mockSupabase.from.mockImplementationOnce(() => ({
        update: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            select: jest.fn().mockImplementation(() => ({
              single: mockUpdateSingle
            }))
          }))
        }))
      }));
      
      const result = await service.updatePurchaseStatus('payment-123', 'completed');
      
      expect(result.success).toBe(true);
    });
    
    it('should not update if purchase already has the desired status', async () => {
      // Mock finding purchase with status already completed
      const mockSessionSelect = jest.fn().mockResolvedValue({
        data: [{ id: 'purchase-123', status: 'completed' }],
        error: null
      });
      
      const mockUpdate = jest.fn();
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            limit: mockSessionSelect
          }))
        })),
        update: mockUpdate
      }));
      
      const result = await service.updatePurchaseStatus('session-123', 'completed');
      
      expect(result).toEqual({
        data: { id: 'purchase-123' },
        error: null,
        success: true
      });
      
      // Should not try to update
      expect(mockUpdate).not.toHaveBeenCalled();
    });
    
    it('should return error if purchase not found', async () => {
      // No purchase found by session ID
      const mockSessionSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // No purchase found by payment intent ID
      const mockPaymentIntentSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      // First from() call for session ID query
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            limit: mockSessionSelect
          }))
        }))
      }));
      
      // Second from() call for payment intent ID query
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            limit: mockPaymentIntentSelect
          }))
        }))
      }));
      
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
      
      const mockPurchasesSelect = jest.fn().mockResolvedValue({
        data: mockData,
        error: null
      });
      
      // Setup mock for purchases query
      mockSupabase.from.mockImplementationOnce(() => ({
        select: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockImplementation(() => ({
            order: mockPurchasesSelect
          }))
        }))
      }));
      
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
