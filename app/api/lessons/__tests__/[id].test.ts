import { NextRequest, NextResponse } from 'next/server';
import { PATCH, DELETE } from '../[id]/route';
import { lessonsService } from '@/app/services/database/lessonsService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createProductForLesson, createPriceForProduct, canCreatePaidLessons } from '@/app/services/stripe';

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
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

jest.mock('@/app/services/database/lessonsService', () => ({
  lessonsService: {
    isLessonOwner: jest.fn(),
    getLessonById: jest.fn(),
    updateLesson: jest.fn(),
    deleteLesson: jest.fn()
  }
}));

jest.mock('@/app/services/stripe', () => ({
  createProductForLesson: jest.fn(),
  createPriceForProduct: jest.fn(),
  canCreatePaidLessons: jest.fn()
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

describe('Lesson API - [id] route', () => {
  const mockLessonId = 'test-lesson-id';
  const mockUserId = 'test-user-id';
  
  let mockRequest: NextRequest | Request;
  let mockSupabaseClient: any;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock request
    mockRequest = new Request(
      `http://localhost:3000/api/lessons/${mockLessonId}`,
      {
        method: 'PATCH'
      }
    ) as unknown as NextRequest;
    
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
            stripe_account_id: 'test-stripe-account'
          },
          error: null
        })
      })
    };
    
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Mock lesson service responses
    (lessonsService.isLessonOwner as jest.Mock).mockResolvedValue({
      data: true,
      error: null
    });
    
    (lessonsService.getLessonById as jest.Mock).mockResolvedValue({
      data: {
        id: mockLessonId,
        title: 'Test Lesson',
        description: 'Test Description',
        price: 10,
        creator_id: mockUserId,
        stripe_product_id: 'test-product-id',
        stripe_price_id: 'test-price-id',
        previous_stripe_price_ids: []
      },
      error: null
    });
    
    (lessonsService.updateLesson as jest.Mock).mockResolvedValue({
      data: {
        id: mockLessonId,
        title: 'Updated Lesson',
        description: 'Updated Description'
      },
      error: null
    });
    
    (lessonsService.deleteLesson as jest.Mock).mockResolvedValue({
      data: null,
      error: null
    });
    
    // Mock Stripe functions
    (canCreatePaidLessons as jest.Mock).mockResolvedValue(true);
    (createProductForLesson as jest.Mock).mockResolvedValue('new-product-id');
    (createPriceForProduct as jest.Mock).mockResolvedValue('new-price-id');
    
    // Mock JSON.parse for request body
    jest.spyOn(JSON, 'parse').mockImplementation(() => ({
      title: 'Updated Lesson',
      description: 'Updated Description',
      price: 15
    }));
    
    // Mock request.json
    jest.spyOn(mockRequest, 'json').mockResolvedValue({
      title: 'Updated Lesson',
      description: 'Updated Description',
      price: 15
    });
  });
  
  describe('PATCH method', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock no session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      });
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });
    
    it('should return 403 if user is not the lesson owner', async () => {
      // Mock user is not owner
      (lessonsService.isLessonOwner as jest.Mock).mockResolvedValue({
        data: false,
        error: null
      });
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ 
        message: 'You do not have permission to edit this lesson' 
      });
    });
    
    it('should return 500 if owner check fails', async () => {
      // Mock owner check error
      (lessonsService.isLessonOwner as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'Failed to verify lesson ownership',
        details: new Error('Database error')
      });
    });
    
    it('should return 500 if fetching current lesson fails', async () => {
      // Mock fetch error
      (lessonsService.getLessonById as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Fetch error')
      });
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'Failed to fetch current lesson',
        details: new Error('Fetch error')
      });
    });
    
    it('should return 403 if user cannot create paid lessons', async () => {
      // Mock user cannot create paid lessons
      (canCreatePaidLessons as jest.Mock).mockResolvedValue(false);
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ 
        message: 'Stripe account required for paid lessons'
      });
    });
    
    it('should return 403 if user has no Stripe account', async () => {
      // Mock no Stripe account
      mockSupabaseClient.from().single.mockResolvedValue({
        data: { stripe_account_id: null },
        error: null
      });
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ 
        message: 'Stripe account required'
      });
    });
    
    it('should update lesson with new price and Stripe IDs', async () => {
      const response = await PATCH(mockRequest);
      
      expect(createProductForLesson).not.toHaveBeenCalled(); // Should use existing product ID
      expect(createPriceForProduct).toHaveBeenCalledWith('test-product-id', 15);
      expect(lessonsService.updateLesson).toHaveBeenCalledWith(
        mockLessonId,
        expect.objectContaining({
          title: 'Updated Lesson',
          description: 'Updated Description',
          price: 15,
          stripe_product_id: 'test-product-id',
          stripe_price_id: 'new-price-id',
          previous_stripe_price_ids: ['test-price-id']
        })
      );
      
      expect(response.status).toBe(200);
    });
    
    it('should create new product if none exists', async () => {
      // Mock lesson with no product ID
      (lessonsService.getLessonById as jest.Mock).mockResolvedValue({
        data: {
          id: mockLessonId,
          title: 'Test Lesson',
          description: 'Test Description',
          price: 10,
          creator_id: mockUserId,
          stripe_product_id: null,
          stripe_price_id: null,
          previous_stripe_price_ids: []
        },
        error: null
      });
      
      const response = await PATCH(mockRequest);
      
      expect(createProductForLesson).toHaveBeenCalledWith({
        id: mockLessonId,
        title: 'Updated Lesson',
        description: 'Updated Description'
      });
      expect(createPriceForProduct).toHaveBeenCalledWith('new-product-id', 15);
      
      expect(response.status).toBe(200);
    });
    
    it('should handle Stripe errors gracefully', async () => {
      // Mock Stripe error
      (createPriceForProduct as jest.Mock).mockRejectedValue(new Error('Stripe API error'));
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'Failed to update Stripe product/price',
        details: 'Stripe API error'
      });
    });
    
    it('should return 500 if lesson update fails', async () => {
      // Mock update error
      (lessonsService.updateLesson as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Update error')
      });
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'Failed to update lesson',
        details: new Error('Update error')
      });
    });
    
    it('should handle unexpected errors', async () => {
      // Mock unexpected error
      jest.spyOn(mockRequest, 'json').mockRejectedValue(new Error('Unexpected error'));
      
      const response = await PATCH(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'An unexpected error occurred'
      });
    });
  });
  
  describe('DELETE method', () => {
    beforeEach(() => {
      // Create a standard Request object instead of NextRequest
      mockRequest = new Request(
        `http://localhost:3000/api/lessons/${mockLessonId}`,
        {
          method: 'DELETE'
        }
      ) as unknown as NextRequest;
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock no session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      });
      
      const response = await DELETE(mockRequest);
      
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
    });
    
    it('should return 403 if user is not the lesson owner', async () => {
      // Mock user is not owner
      (lessonsService.isLessonOwner as jest.Mock).mockResolvedValue({
        data: false,
        error: null
      });
      
      const response = await DELETE(mockRequest);
      
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ 
        message: 'You do not have permission to delete this lesson' 
      });
    });
    
    it('should return 500 if owner check fails', async () => {
      // Mock owner check error
      (lessonsService.isLessonOwner as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });
      
      const response = await DELETE(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'Failed to verify lesson ownership',
        details: new Error('Database error')
      });
    });
    
    it('should delete lesson successfully', async () => {
      const response = await DELETE(mockRequest);
      
      expect(lessonsService.deleteLesson).toHaveBeenCalledWith(mockLessonId);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ 
        message: 'Lesson deleted successfully'
      });
    });
    
    it('should return 500 if lesson deletion fails', async () => {
      // Mock deletion error
      (lessonsService.deleteLesson as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Deletion error')
      });
      
      const response = await DELETE(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'Failed to delete lesson',
        details: new Error('Deletion error')
      });
    });
    
    it('should handle unexpected errors', async () => {
      // Mock unexpected error
      jest.spyOn(mockRequest, 'url', 'get').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const response = await DELETE(mockRequest);
      
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ 
        message: 'An unexpected error occurred'
      });
    });
  });
});
