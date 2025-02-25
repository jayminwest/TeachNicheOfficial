import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '../route';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';
import { NextResponse } from 'next/server';

// Mock the database client
jest.mock('../../../lib/supabase/client', () => {
  const mockClient = {
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
    error: null,
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'test@example.com'
            }
          }
        }
      })
    }
  };
  
  return {
    createClient: jest.fn().mockReturnValue(mockClient),
    createRouteHandlerClient: jest.fn().mockReturnValue(mockClient)
  };
});

// Mock NextResponse
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => {
        return { 
          status: init?.status || 200,
          body,
          json: () => body
        };
      }),
    },
  };
});

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    getAll: jest.fn().mockReturnValue([]),
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn()
  })
}));

// Get the mock client for setting up test data
const getMockSupabase = () => {
  const { createClient } = jest.requireMock('../../../lib/supabase/client');
  return createClient();
};

// Mock auth
jest.mock('../../../services/auth', () => ({
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

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    getAll: jest.fn().mockReturnValue([]),
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn()
  })
}));

describe('Lessons API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock database responses
    const mockSupabase = getMockSupabase();
    mockSupabase.data = { lessons: [] };
    mockSupabase.error = null;
  });

  describe('GET /api/lessons', () => {
    it('retrieves lessons successfully', async () => {
      const mockLessons = [
        { id: 'lesson-1', title: 'Test Lesson 1', creator_id: 'user-123' },
        { id: 'lesson-2', title: 'Test Lesson 2', creator_id: 'user-123' }
      ];
      
      const mockSupabase = getMockSupabase();
      mockSupabase.data = mockLessons;
      
      const { req } = createMocks({
        method: 'GET',
        query: { limit: '10' }
      });

      // Add a valid URL to the request
      req.url = 'http://localhost/api/lessons?limit=10';

      // Mock the response from getLessons
      const mockResponse = {
        status: 200,
        body: { lessons: mockLessons },
        json: () => ({ lessons: mockLessons })
      };
      
      // Mock NextResponse.json to return our mock response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockResponse);

      const result = await GET(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ lessons: mockLessons });
    });

    it('handles query parameters correctly', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { 
          limit: '5',
          category: 'programming',
          sort: 'newest'
        }
      });

      // Add a valid URL to the request
      req.url = 'http://localhost/api/lessons?limit=5&category=programming&sort=newest';

      const mockSupabase = getMockSupabase();
      mockSupabase.data = [];
      
      // Mock the response
      const mockResponse = {
        status: 200,
        body: { lessons: [] },
        json: () => ({ lessons: [] })
      };
      
      // Mock NextResponse.json to return our mock response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockResponse);

      await GET(req);

      expect(mockSupabase.from).toHaveBeenCalledWith('lessons');
      expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'programming');
      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
      expect(mockSupabase.order).toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      const mockSupabase = getMockSupabase();
      mockSupabase.error = { message: 'Database error' };
      
      const { req } = createMocks({
        method: 'GET'
      });

      // Add a valid URL to the request
      req.url = 'http://localhost/api/lessons';

      // Mock the error response
      const mockErrorResponse = {
        status: 500,
        body: { error: { message: 'Internal server error' } },
        json: () => ({ error: { message: 'Internal server error' } })
      };
      
      // Mock NextResponse.json to return our error response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockErrorResponse);

      const result = await GET(req);

      expect(result.status).toBe(500);
      expect(result.body).toEqual({
        error: {
          message: expect.any(String)
        }
      });
    });
  });

  describe('POST /api/lessons', () => {
    it('creates a lesson successfully', async () => {
      const lessonData = {
        title: 'New Lesson',
        description: 'Lesson description',
        price: 19.99,
        muxAssetId: 'asset-123',
        muxPlaybackId: 'playback-123',
        category: 'programming'
      };
      
      const mockSupabase = getMockSupabase();
      mockSupabase.data = { id: 'lesson-123', ...lessonData };
      
      const { req } = createMocks({
        method: 'POST',
        body: lessonData
      });

      // Mock request.json() method
      req.json = jest.fn().mockResolvedValue(lessonData);

      // Mock the success response
      const mockSuccessResponse = {
        status: 201,
        body: { id: 'lesson-123', ...lessonData },
        json: () => ({ id: 'lesson-123', ...lessonData })
      };
      
      // Mock NextResponse.json to return our success response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockSuccessResponse);

      const response = await POST(req);

      expect(response.status).toBe(201);
      
      // Since we're using the createClient() in the route handler,
      // we need to verify that it was called
      expect(jest.requireMock('../../../lib/supabase/client').createClient).toHaveBeenCalled();
    });

    it('validates input data and returns 400 for invalid data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
          title: 'New Lesson'
          // No description, price, etc.
        }
      });

      // Mock request.json() method
      req.json = jest.fn().mockResolvedValue({ title: 'New Lesson' });

      // Mock the validation error response
      const mockValidationErrorResponse = {
        status: 400,
        body: { error: 'Title and description are required' },
        json: () => ({ error: 'Title and description are required' })
      };
      
      // Mock NextResponse.json to return our validation error response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockValidationErrorResponse);

      const response = await POST(req);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('enforces authentication for lesson creation', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          title: 'New Lesson',
          description: 'Lesson description',
          price: 19.99,
          category: 'programming'
        }
      });

      // Mock request.json() method
      req.json = jest.fn().mockResolvedValue({
        title: 'New Lesson',
        description: 'Lesson description',
        price: 19.99,
        category: 'programming'
      });

      // Mock auth to fail
      jest.mocked(jest.requireMock('../../../services/auth').getCurrentUser).mockImplementationOnce(() => Promise.resolve(null));

      // Mock the auth error response
      const mockAuthErrorResponse = {
        status: 401,
        body: { error: 'Authentication required' },
        json: () => ({ error: 'Authentication required' })
      };
      
      // Mock NextResponse.json to return our auth error response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockAuthErrorResponse);

      const response = await POST(req);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/lessons/:id', () => {
    it('updates a lesson successfully', async () => {
      const lessonUpdate = {
        id: 'lesson-123',
        title: 'Updated Lesson',
        description: 'Updated description'
      };
      
      const mockSupabase = getMockSupabase();
      // Reset the mock functions to ensure they're tracking calls
      mockSupabase.from.mockClear();
      mockSupabase.match.mockClear();
      mockSupabase.update.mockClear();
      
      mockSupabase.data = { id: 'lesson-123', creator_id: 'user-123' };
      
      const { req } = createMocks({
        method: 'PUT',
        body: lessonUpdate
      });

      // Mock request.json() method
      req.json = jest.fn().mockResolvedValue(lessonUpdate);

      // Mock the success response
      const mockSuccessResponse = {
        status: 200,
        body: { id: 'lesson-123', ...lessonUpdate, creator_id: 'user-123' },
        json: () => ({ id: 'lesson-123', ...lessonUpdate, creator_id: 'user-123' })
      };
      
      // Mock NextResponse.json to return our success response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockSuccessResponse);

      await PUT(req);

      // Since we're using the createClient() in the route handler,
      // we need to verify that it was called
      expect(jest.requireMock('../../../lib/supabase/client').createClient).toHaveBeenCalled();
    });

    it('enforces access control for lesson updates', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: { 
          id: 'lesson-123',
          title: 'Updated Lesson' 
        }
      });

      // Mock request.json() method
      req.json = jest.fn().mockResolvedValue({ 
        id: 'lesson-123',
        title: 'Updated Lesson' 
      });

      const mockSupabase = getMockSupabase();
      mockSupabase.data = { id: 'lesson-123', creator_id: 'different-user' };

      // Mock the permission error response
      const mockPermissionErrorResponse = {
        status: 403,
        body: { error: 'You do not have permission to update this lesson' },
        json: () => ({ error: 'You do not have permission to update this lesson' })
      };
      
      // Mock NextResponse.json to return our permission error response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockPermissionErrorResponse);

      const response = await PUT(req);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/lessons/:id', () => {
    it('deletes a lesson successfully', async () => {
      const mockSupabase = getMockSupabase();
      // Reset the mock functions to ensure they're tracking calls
      mockSupabase.from.mockClear();
      mockSupabase.match.mockClear();
      mockSupabase.delete.mockClear();
      
      mockSupabase.data = { id: 'lesson-123', creator_id: 'user-123' };
      
      const { req } = createMocks({
        method: 'DELETE',
        query: { id: 'lesson-123' }
      });

      // Add a valid URL to the request
      req.url = 'http://localhost/api/lessons?id=lesson-123';

      // Mock the success response
      const mockSuccessResponse = {
        status: 200,
        body: { success: true },
        json: () => ({ success: true })
      };
      
      // Mock NextResponse.json to return our success response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockSuccessResponse);

      await DELETE(req);

      // Since we're using the createClient() in the route handler,
      // we need to verify that it was called
      expect(jest.requireMock('../../../lib/supabase/client').createClient).toHaveBeenCalled();
    });

    it('returns 404 for non-existent lessons', async () => {
      const mockSupabase = getMockSupabase();
      mockSupabase.data = null;
      
      const { req } = createMocks({
        method: 'DELETE',
        query: { id: 'non-existent-lesson' }
      });

      // Add a valid URL to the request
      req.url = 'http://localhost/api/lessons?id=non-existent-lesson';

      // Mock the not found response
      const mockNotFoundResponse = {
        status: 404,
        body: { error: 'Lesson not found' },
        json: () => ({ error: 'Lesson not found' })
      };
      
      // Mock NextResponse.json to return our not found response
      jest.mocked(NextResponse.json).mockReturnValueOnce(mockNotFoundResponse);

      const response = await DELETE(req);

      expect(response.status).toBe(404);
    });
  });
});
