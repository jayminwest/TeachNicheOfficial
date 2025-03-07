// Import necessary dependencies
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { GET } from '../votes/route';
import { createMockSupabaseClient, resetSupabaseMocks } from '../../../__mocks__/services/supabase';

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(data), init);
      Object.defineProperty(response, 'status', {
        get() {
          return init?.status || 200;
        }
      });
      return response;
    }
  }
}));

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
}));

jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => []
  })
}));

// Mock Request class
class MockRequest {
  url: string;
  method?: string;

  constructor(input: string | Request, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
  }
}

global.Request = MockRequest as unknown as typeof Request;

describe('Votes API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks();
  });

  describe('GET /api/votes', () => {
    it('retrieves vote for valid request and user IDs', async () => {
      // Mock successful vote retrieval
      const mockVote = {
        id: 'vote-123',
        request_id: 'request-123',
        user_id: 'user-123',
        vote_type: 'upvote',
        created_at: '2023-01-01T00:00:00.000Z'
      };

      const mockSupabase = createMockSupabaseClient();
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockVote,
          error: null
        })
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new Request('http://localhost/api/votes?requestId=request-123&userId=user-123');
      const response = await GET(request);
      
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toEqual(mockVote);
      
      // Verify correct parameters were used
      expect(mockSupabase.from).toHaveBeenCalledWith('lesson_request_votes');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('id, request_id, user_id, vote_type, created_at');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('request_id', 'request-123');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('returns null for non-existent vote', async () => {
      // Mock no vote found (PGRST116 is the "not found" error code)
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new Request('http://localhost/api/votes?requestId=request-123&userId=user-123');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toBeNull();
    });

    it('requires request ID parameter', async () => {
      const mockSupabase = createMockSupabaseClient();
      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new Request('http://localhost/api/votes?userId=user-123');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Missing required parameters');
    });

    it('requires user ID parameter', async () => {
      const mockSupabase = createMockSupabaseClient();
      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new Request('http://localhost/api/votes?requestId=request-123');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Missing required parameters');
    });

    it('handles database errors gracefully', async () => {
      // Mock database error
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST500', message: 'Database error' }
        })
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new Request('http://localhost/api/votes?requestId=request-123&userId=user-123');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Failed to fetch vote');
    });

    it('handles unexpected exceptions', async () => {
      // Mock unexpected error
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new Request('http://localhost/api/votes?requestId=request-123&userId=user-123');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Internal server error');
    });
  });
});
