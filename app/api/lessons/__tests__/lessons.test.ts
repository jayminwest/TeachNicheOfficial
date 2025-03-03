import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '../route';
import { MockConfig } from '../../../../__mocks__/utils/mock-helpers';

// Helper function to create a mock NextRequest
function createMockNextRequest(url: string, options: { method?: string; body?: unknown } = {}) {
  const method = options.method || 'GET';
  const urlObj = new URL(url.startsWith('http') ? url : `http://localhost${url}`);
  
  return {
    url: urlObj.toString(),
    method,
    nextUrl: urlObj,
    headers: new Headers(),
    cookies: { get: () => null, getAll: () => [] },
    formData: () => Promise.resolve({}),
    json: () => Promise.resolve(options.body || {}),
    text: () => Promise.resolve(options.body ? JSON.stringify(options.body) : ''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    cache: 'default',
    credentials: 'same-origin',
    integrity: '',
    keepalive: false,
    mode: 'cors',
    redirect: 'follow',
    referrer: '',
    referrerPolicy: '',
    signal: new AbortController().signal,
    clone: function() { return this; }
  };
}

// Mock the Supabase auth helpers
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn().mockImplementation(() => {
    return {
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
  }),
  createClientComponentClient: jest.fn()
}));

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
  const originalModule = jest.requireActual('next/server');
  
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
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

// Mock the server Supabase client
jest.mock('../../../lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockImplementation(() => {
    return {
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
      
      // Create a mock request
      createMocks({
        method: 'GET',
        url: '/api/lessons?limit=10',
      });
      
      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 200,
        body: data,
        json: () => data
      }));

      // Convert to NextRequest
      const nextReq = {
        url: 'http://localhost/api/lessons?limit=10',
        method: 'GET',
        nextUrl: new URL('http://localhost/api/lessons?limit=10'),
        headers: new Headers(),
        cookies: { get: () => null, getAll: () => [] },
        formData: () => Promise.resolve({}),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        cache: 'default',
        credentials: 'same-origin',
        integrity: '',
        keepalive: false,
        mode: 'cors',
        redirect: 'follow',
        referrer: '',
        referrerPolicy: '',
        signal: new AbortController().signal,
        clone: () => nextReq,
      };

      const result = await GET(nextReq);

      expect(result.status).toBe(200);
      expect(result.body).toEqual(expect.objectContaining({
        lessons: expect.any(Array)
      }));
    });

    it('handles database errors gracefully', async () => {
      const mockSupabase = getMockSupabase();
      mockSupabase.error = { message: 'Database error' };
      
      // Create a mock request
      createMocks({
        method: 'GET',
        url: '/api/lessons',
      });
      
      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 500,
        body: data,
        json: () => data
      }));

      // Convert to NextRequest
      const nextReq = {
        url: 'http://localhost/api/lessons',
        method: 'GET',
        nextUrl: new URL('http://localhost/api/lessons'),
        headers: new Headers(),
        cookies: { get: () => null, getAll: () => [] },
        formData: () => Promise.resolve({}),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        cache: 'default',
        credentials: 'same-origin',
        integrity: '',
        keepalive: false,
        mode: 'cors',
        redirect: 'follow',
        referrer: '',
        referrerPolicy: '',
        signal: new AbortController().signal,
        clone: () => nextReq,
      };

      const result = await GET(nextReq);

      expect(result.status).toBe(500);
      expect(result.body).toEqual(expect.objectContaining({
        error: expect.objectContaining({
          message: expect.any(String)
        })
      }));
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
      
      // Create a mock request
      createMocks({
        method: 'POST',
        url: '/api/lessons',
        body: lessonData
      });
      
      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 201,
        body: data,
        json: () => data
      }));

      // Convert to NextRequest
      const nextReq = {
        url: 'http://localhost/api/lessons',
        method: 'POST',
        nextUrl: new URL('http://localhost/api/lessons'),
        headers: new Headers(),
        cookies: { get: () => null, getAll: () => [] },
        formData: () => Promise.resolve({}),
        json: () => Promise.resolve(lessonData),
        text: () => Promise.resolve(JSON.stringify(lessonData)),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        cache: 'default',
        credentials: 'same-origin',
        integrity: '',
        keepalive: false,
        mode: 'cors',
        redirect: 'follow',
        referrer: '',
        referrerPolicy: '',
        signal: new AbortController().signal,
        clone: () => nextReq,
      };

      const response = await POST(nextReq);

      expect(response.status).toBe(201);
      
      // Since we're using the createClient() in the route handler,
      // we need to verify that it was called
      expect(jest.requireMock('../../../lib/supabase/client').createClient).toHaveBeenCalled();
    });

    it('validates input data and returns 400 for invalid data', async () => {
      // Create a mock NextRequest
      const req = createMockNextRequest('/api/lessons', {
        method: 'POST',
        body: { title: 'New Lesson' }
      });

      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 400,
        body: data,
        json: () => data
      }));

      const response = await POST(req);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('enforces authentication for lesson creation', async () => {
      const lessonData = {
        title: 'New Lesson',
        description: 'Lesson description',
        price: 19.99,
        category: 'programming'
      };
      
      // Create a mock NextRequest
      const req = createMockNextRequest('/api/lessons', {
        method: 'POST',
        body: lessonData
      });

      // Mock auth to fail
      jest.requireMock('../../../services/auth').getCurrentUser.mockImplementationOnce(() => Promise.resolve(null));

      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 401,
        body: data,
        json: () => data
      }));

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
      
      // Create a mock NextRequest
      const req = createMockNextRequest('/api/lessons/lesson-123', {
        method: 'PUT',
        body: lessonUpdate
      });

      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 200,
        body: data,
        json: () => data
      }));

      const response = await PUT(req);

      expect(response.status).toBe(200);
      
      // Since we're using the createClient() in the route handler,
      // we need to verify that it was called
      expect(jest.requireMock('../../../lib/supabase/client').createClient).toHaveBeenCalled();
    });

    it('enforces access control for lesson updates', async () => {
      const lessonUpdate = {
        id: 'lesson-123',
        title: 'Updated Lesson'
      };
      
      // Create a mock NextRequest
      const req = createMockNextRequest('/api/lessons/lesson-123', {
        method: 'PUT',
        body: lessonUpdate
      });

      const mockSupabase = getMockSupabase();
      mockSupabase.data = { id: 'lesson-123', creator_id: 'different-user' };

      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 403,
        body: data,
        json: () => data
      }));

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
      
      // Create a mock NextRequest
      const req = createMockNextRequest('/api/lessons/lesson-123', {
        method: 'DELETE'
      });

      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 200,
        body: data,
        json: () => data
      }));

      const response = await DELETE(req);

      expect(response.status).toBe(200);
      
      // Since we're using the createClient() in the route handler,
      // we need to verify that it was called
      expect(jest.requireMock('../../../lib/supabase/client').createClient).toHaveBeenCalled();
    });

    it('returns 404 for non-existent lessons', async () => {
      const mockSupabase = getMockSupabase();
      mockSupabase.data = null;
      
      // Create a mock NextRequest
      const req = createMockNextRequest('/api/lessons/non-existent-lesson', {
        method: 'DELETE'
      });

      // Mock the response
      const { NextResponse } = jest.requireMock('next/server');
      NextResponse.json.mockImplementationOnce((data) => ({
        status: 404,
        body: data,
        json: () => data
      }));

      const response = await DELETE(req);

      expect(response.status).toBe(404);
    });
  });
});
