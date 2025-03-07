// Import necessary dependencies
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { GET, POST } from '../votes/route';
import { createMockSupabaseClient, resetSupabaseMocks } from '../../../__mocks__/services/supabase';
import { voteSchema } from '@/app/lib/schemas/lesson-request';

// Mock schema validation
jest.mock('@/app/lib/schemas/lesson-request', () => ({
  voteSchema: {
    parse: jest.fn((data) => data)
  }
}));

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
  body?: string;

  constructor(input: string | Request, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
    this.body = init?.body as string;
  }

  async json() {
    return JSON.parse(this.body || '{}');
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

  describe('POST /api/votes', () => {
    it('requires authentication', async () => {
      // Mock unauthenticated session
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      const request = new Request('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify({ requestId: 'request-123', voteType: 'upvote' })
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Unauthorized');
    });

    it('validates input data', async () => {
      // Mock authenticated session
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null
      });

      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

      // Mock validation error
      (voteSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const request = new Request('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify({ requestId: 'request-123', voteType: 'invalid' })
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Failed to process vote');
      expect(responseData).toHaveProperty('success', false);
    });

    it('creates a new vote when none exists', async () => {
      // Mock authenticated session
      const mockUser = { id: 'user-123' };
      const mockSession = { user: mockUser };
      
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      
      // Mock checking for existing vote (none found)
      const mockExistingVoteQuery = {
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      };
      
      // Mock creating new vote
      const mockNewVote = {
        id: 'vote-123',
        request_id: 'request-123',
        user_id: 'user-123',
        vote_type: 'upvote',
        created_at: '2023-01-01T00:00:00.000Z'
      };
      
      // Mock vote count after insertion
      const mockVoteCount = {
        count: 1,
        error: null
      };
      
      // Setup mock chain for checking existing vote
      const mockSingleExisting = jest.fn().mockResolvedValue(mockExistingVoteQuery);
      const mockEqExisting = jest.fn().mockReturnValue({ single: mockSingleExisting });
      const mockEq2Existing = jest.fn().mockReturnValue({ eq: mockEqExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEq2Existing });
      
      // Setup mock chain for creating new vote
      const mockSingleInsert = jest.fn().mockResolvedValue({
        data: mockNewVote,
        error: null
      });
      const mockSelectInsert = jest.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelectInsert });
      
      // Setup mock chain for counting votes
      const mockHeadCount = jest.fn().mockResolvedValue(mockVoteCount);
      const mockEqCount = jest.fn().mockReturnValue({ head: mockHeadCount });
      const mockSelectCount = jest.fn().mockReturnValue({ eq: mockEqCount });
      
      // Setup mock chain for updating request
      const mockEqUpdate = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });
      
      // Mock the schema validation to avoid validation errors
      (voteSchema.parse as jest.Mock).mockReturnValue({
        requestId: 'request-123',
        voteType: 'upvote'
      });
      
      // Setup the from method to return different chains based on call count
      let fromCallCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return { select: mockSelectExisting };
        } else if (fromCallCount === 2) {
          return { insert: mockInsert };
        } else if (fromCallCount === 3) {
          return { select: mockSelectCount };
        } else {
          return { update: mockUpdate };
        }
      });
      
      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
      
      const requestData = { requestId: 'request-123', voteType: 'upvote' };
      const request = new Request('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toEqual({
        success: true,
        currentVotes: 1,
        userHasVoted: true,
        data: expect.objectContaining({
          id: 'vote-123',
          request_id: 'request-123',
          user_id: 'user-123',
          vote_type: 'upvote'
        })
      });
      
      // Verify the correct operations were performed
      expect(mockSupabase.from).toHaveBeenCalledTimes(4);
      expect(mockSupabase.from).toHaveBeenCalledWith('lesson_request_votes');
      expect(mockInsert).toHaveBeenCalledWith([{
        request_id: 'request-123',
        user_id: 'user-123',
        vote_type: 'upvote',
        created_at: expect.any(String)
      }]);
      expect(mockUpdate).toHaveBeenCalledWith({ vote_count: 1 });
    });

    it('removes an existing vote (toggle behavior)', async () => {
      // Mock authenticated session
      const mockUser = { id: 'user-123' };
      const mockSession = { user: mockUser };
      
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      
      // Mock existing vote
      const mockExistingVote = {
        id: 'vote-123',
        request_id: 'request-123',
        user_id: 'user-123',
        vote_type: 'upvote',
        created_at: '2023-01-01T00:00:00.000Z'
      };
      
      // Mock vote count after deletion
      const mockVoteCount = {
        count: 0,
        error: null
      };
      
      // Setup mock chain for checking existing vote
      const mockSingleExisting = jest.fn().mockResolvedValue({
        data: mockExistingVote,
        error: null
      });
      const mockEqExisting = jest.fn().mockReturnValue({ single: mockSingleExisting });
      const mockEq2Existing = jest.fn().mockReturnValue({ eq: mockEqExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEq2Existing });
      
      // Setup mock chain for deleting vote
      const mockEqDelete = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEqDelete });
      
      // Setup mock chain for counting votes
      const mockHeadCount = jest.fn().mockResolvedValue(mockVoteCount);
      const mockEqCount = jest.fn().mockReturnValue({ head: mockHeadCount });
      const mockSelectCount = jest.fn().mockReturnValue({ eq: mockEqCount });
      
      // Setup mock chain for updating request
      const mockEqUpdate = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });
      
      // Mock the schema validation to avoid validation errors
      (voteSchema.parse as jest.Mock).mockReturnValue({
        requestId: 'request-123',
        voteType: 'upvote'
      });
      
      // Setup the from method to return different chains based on call count
      let fromCallCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return { select: mockSelectExisting };
        } else if (fromCallCount === 2) {
          return { delete: mockDelete };
        } else if (fromCallCount === 3) {
          return { select: mockSelectCount };
        } else {
          return { update: mockUpdate };
        }
      });
      
      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
      
      const requestData = { requestId: 'request-123', voteType: 'upvote' };
      const request = new Request('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toEqual({
        success: true,
        currentVotes: 0,
        userHasVoted: false,
        data: null
      });
      
      // Verify the correct operations were performed
      expect(mockSupabase.from).toHaveBeenCalledTimes(4);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEqDelete).toHaveBeenCalledWith('id', 'vote-123');
      expect(mockUpdate).toHaveBeenCalledWith({ vote_count: 0 });
    });

    it('handles database errors during vote creation', async () => {
      // Mock authenticated session
      const mockUser = { id: 'user-123' };
      const mockSession = { user: mockUser };
      
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      
      // Mock checking for existing vote (none found)
      const mockExistingVoteQuery = {
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      };
      
      // Setup mock chain for checking existing vote
      const mockSingleExisting = jest.fn().mockResolvedValue(mockExistingVoteQuery);
      const mockEqExisting = jest.fn().mockReturnValue({ single: mockSingleExisting });
      const mockEq2Existing = jest.fn().mockReturnValue({ eq: mockEqExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEq2Existing });
      
      // Setup mock chain for creating new vote with error
      const mockSingleInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error during insert' }
      });
      const mockSelectInsert = jest.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelectInsert });
      
      // Mock the schema validation to avoid validation errors
      (voteSchema.parse as jest.Mock).mockReturnValue({
        requestId: 'request-123',
        voteType: 'upvote'
      });
      
      // Setup the from method to return different chains based on call count
      let fromCallCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return { select: mockSelectExisting };
        } else {
          return { insert: mockInsert };
        }
      });
      
      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
      
      const requestData = { requestId: 'request-123', voteType: 'upvote' };
      const request = new Request('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toEqual({
        error: 'Failed to process vote',
        success: false,
        currentVotes: 0,
        userHasVoted: false
      });
    });

    it('handles database errors during vote count update', async () => {
      // Mock authenticated session
      const mockUser = { id: 'user-123' };
      const mockSession = { user: mockUser };
      
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      
      // Mock checking for existing vote (none found)
      const mockExistingVoteQuery = {
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      };
      
      // Mock creating new vote
      const mockNewVote = {
        id: 'vote-123',
        request_id: 'request-123',
        user_id: 'user-123',
        vote_type: 'upvote',
        created_at: expect.any(String)
      };
      
      // Setup mock chain for checking existing vote
      const mockSingleExisting = jest.fn().mockResolvedValue(mockExistingVoteQuery);
      const mockEqExisting = jest.fn().mockReturnValue({ single: mockSingleExisting });
      const mockEq2Existing = jest.fn().mockReturnValue({ eq: mockEqExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEq2Existing });
      
      // Setup mock chain for creating new vote
      const mockSingleInsert = jest.fn().mockResolvedValue({
        data: mockNewVote,
        error: null
      });
      const mockSelectInsert = jest.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelectInsert });
      
      // Setup mock chain for counting votes with error
      const mockHeadCount = jest.fn().mockResolvedValue({
        count: null,
        error: { message: 'Error counting votes' }
      });
      const mockEqCount = jest.fn().mockReturnValue({ head: mockHeadCount });
      const mockSelectCount = jest.fn().mockReturnValue({ eq: mockEqCount });
      
      // Mock the schema validation to avoid validation errors
      (voteSchema.parse as jest.Mock).mockReturnValue({
        requestId: 'request-123',
        voteType: 'upvote'
      });
      
      // Setup the from method to return different chains based on call count
      let fromCallCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return { select: mockSelectExisting };
        } else if (fromCallCount === 2) {
          return { insert: mockInsert };
        } else {
          return { select: mockSelectCount };
        }
      });
      
      (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
      
      const requestData = { requestId: 'request-123', voteType: 'upvote' };
      const request = new Request('http://localhost/api/votes', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toEqual({
        error: 'Failed to process vote',
        success: false,
        currentVotes: 0,
        userHasVoted: false
      });
    });
  });
});
