// Mock next/server before any other imports
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => body
    })
  }
}));

// Set up test environment
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { POST } from '../requests/vote/route'
import { createMockSupabaseClient, resetSupabaseMocks } from '../../../__mocks__/services/supabase'

// Mock Request globally
const mockRequest = (url: string, init?: RequestInit) => ({
  url,
  method: init?.method || 'GET',
  json: async () => JSON.parse(init?.body as string || '{}')
});

global.Request = jest.fn().mockImplementation(mockRequest) as unknown as typeof Request;

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
}))

jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => []
  })
}))

describe('Vote API Route', () => {
  const mockSession = {
    user: { id: 'test-user-id' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    resetSupabaseMocks()
  })

  it('requires authentication', async () => {
    // Mock unauthenticated state
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    })

    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        voteType: 'upvote'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('processes a valid vote request', async () => {
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    // Mock checking for existing vote
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'lesson_request_votes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnValue({ count: 'exact', head: true }),
          select: jest.fn().mockResolvedValue({ count: 5, error: null })
        }
      } else if (table === 'lesson_requests') {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        }
      }
      return {}
    })

    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        voteType: 'upvote'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData).toHaveProperty('currentVotes')
    expect(responseData).toHaveProperty('userHasVoted')
  })

  it('toggles vote when user votes twice', async () => {
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    // Mock existing vote
    const existingVote = {
      id: 'vote-123',
      request_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'test-user-id',
      vote_type: 'upvote'
    }
    
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'lesson_request_votes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: existingVote, error: null }),
          delete: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnValue({ count: 'exact', head: true }),
          select: jest.fn().mockResolvedValue({ count: 4, error: null }) // Count decreased after removal
        }
      } else if (table === 'lesson_requests') {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        }
      }
      return {}
    })

    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        voteType: 'upvote'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.userHasVoted).toBe(false) // Vote was removed
    expect(responseData.currentVotes).toBe(4) // Count decreased
  })

  it('handles database errors during vote creation', async () => {
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    // Mock database error during insert
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'lesson_request_votes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        }
      }
      return {}
    })

    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        voteType: 'upvote'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    
    const responseData = await response.json()
    expect(responseData.success).toBe(false)
    expect(responseData).toHaveProperty('error', 'Failed to process vote')
  })

  it('prevents voting with invalid request ID', async () => {
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })

    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'invalid-uuid', // Not a valid UUID
        voteType: 'upvote'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    
    const responseData = await response.json()
    expect(responseData.success).toBe(false)
  })

  it('updates vote count correctly', async () => {
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    // Mock successful vote creation and count update
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'lesson_request_votes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({ 
            data: [{ id: 'vote-123' }], 
            error: null 
          }),
          count: jest.fn().mockReturnValue({ count: 'exact', head: true }),
          select: jest.fn().mockResolvedValue({ count: 6, error: null }) // Count increased after adding vote
        }
      } else if (table === 'lesson_requests') {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        }
      }
      return {}
    })

    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        voteType: 'upvote'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.userHasVoted).toBe(true)
    expect(responseData.currentVotes).toBe(6) // Count increased
    
    // Verify vote count was updated in lesson_requests table
    expect(mockSupabase.from).toHaveBeenCalledWith('lesson_requests')
    expect(mockSupabase.from().update).toHaveBeenCalledWith({ vote_count: 6 })
  })
})
