import { createMocks } from 'node-mocks-http';
import { getLessons, createLesson, updateLesson, deleteLesson } from '../route';
import { MockConfig } from '@/app/__mocks__/utils/mock-helpers';

// Mock the database client
jest.mock('@/app/lib/supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    data: null,
    error: null
  })
}));

// Mock auth
jest.mock('@/app/services/auth', () => ({
  getCurrentUser: jest.fn().mockImplementation((config?: MockConfig) => {
    if (config?.shouldSucceed === false) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      id: 'user-123',
      email: 'test@example.com'
    });
  }),
  hasPermission: jest.fn().mockImplementation(() => true)
}));

describe('Lessons API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock database responses
    const mockSupabase = require('@/app/lib/supabase/client').createClient();
    mockSupabase.data = { lessons: [] };
    mockSupabase.error = null;
  });

  describe('GET /api/lessons', () => {
    it('retrieves lessons successfully', async () => {
      const mockLessons = [
        { id: 'lesson-1', title: 'Test Lesson 1', user_id: 'user-123' },
        { id: 'lesson-2', title: 'Test Lesson 2', user_id: 'user-123' }
      ];
      
      const mockSupabase = require('@/app/lib/supabase/client').createClient();
      mockSupabase.data = mockLessons;
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '10' }
      });

      await getLessons(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ lessons: mockLessons });
    });

    it('handles query parameters correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          limit: '5',
          category: 'programming',
          sort: 'newest'
        }
      });

      const mockSupabase = require('@/app/lib/supabase/client').createClient();
      mockSupabase.data = [];
      
      await getLessons(req, res);

      expect(mockSupabase.from).toHaveBeenCalledWith('lessons');
      expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'programming');
      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
      expect(mockSupabase.order).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(200);
    });

    it('handles database errors gracefully', async () => {
      const mockSupabase = require('@/app/lib/supabase/client').createClient();
      mockSupabase.error = { message: 'Database error' };
      
      const { req, res } = createMocks({
        method: 'GET'
      });

      await getLessons(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: {
          message: expect.any(String)
        }
      });
    });
  });

  describe('POST /api/lessons', () => {
    it('creates a lesson successfully', async () => {
      const newLesson = {
        title: 'New Lesson',
        description: 'Lesson description',
        price: 19.99,
        category: 'programming'
      };
      
      const mockSupabase = require('@/app/lib/supabase/client').createClient();
      mockSupabase.data = { id: 'new-lesson-id', ...newLesson, user_id: 'user-123' };
      
      const { req, res } = createMocks({
        method: 'POST',
        body: newLesson
      });

      await createLesson(req, res);

      expect(mockSupabase.from).toHaveBeenCalledWith('lessons');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        ...newLesson,
        user_id: 'user-123'
      }));
      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toHaveProperty('id', 'new-lesson-id');
    });

    it('validates input data and returns 400 for invalid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
          title: 'New Lesson'
          // No description, price, etc.
        }
      });

      await createLesson(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });

    it('enforces authentication for lesson creation', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'New Lesson',
          description: 'Lesson description',
          price: 19.99,
          category: 'programming'
        }
      });

      // Mock auth to fail
      require('@/app/services/auth').getCurrentUser.mockImplementationOnce(() => Promise.resolve(null));

      await createLesson(req, res);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('PUT /api/lessons/:id', () => {
    it('updates a lesson successfully', async () => {
      const lessonUpdate = {
        title: 'Updated Lesson',
        description: 'Updated description'
      };
      
      const mockSupabase = require('@/app/lib/supabase/client').createClient();
      mockSupabase.data = { id: 'lesson-123', ...lessonUpdate, user_id: 'user-123' };
      
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'lesson-123' },
        body: lessonUpdate
      });

      await updateLesson(req, res);

      expect(mockSupabase.from).toHaveBeenCalledWith('lessons');
      expect(mockSupabase.match).toHaveBeenCalledWith({ id: 'lesson-123' });
      expect(mockSupabase.update).toHaveBeenCalledWith(lessonUpdate);
      expect(res._getStatusCode()).toBe(200);
    });

    it('enforces access control for lesson updates', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'lesson-123' },
        body: { title: 'Updated Lesson' }
      });

      // Mock permission check to fail
      require('@/app/services/auth').hasPermission.mockImplementationOnce(() => false);

      await updateLesson(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('DELETE /api/lessons/:id', () => {
    it('deletes a lesson successfully', async () => {
      const mockSupabase = require('@/app/lib/supabase/client').createClient();
      mockSupabase.data = { id: 'lesson-123' };
      
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'lesson-123' }
      });

      await deleteLesson(req, res);

      expect(mockSupabase.from).toHaveBeenCalledWith('lessons');
      expect(mockSupabase.match).toHaveBeenCalledWith({ id: 'lesson-123' });
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(200);
    });

    it('returns 404 for non-existent lessons', async () => {
      const mockSupabase = require('@/app/lib/supabase/client').createClient();
      mockSupabase.data = null;
      
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'non-existent-lesson' }
      });

      await deleteLesson(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });
});
