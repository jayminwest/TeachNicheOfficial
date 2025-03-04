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

  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: mockSession }, error: null })
    },
    from: jest.fn().mockImplementation((table) => {
      if (table === 'lesson_request_votes') {
        return {
          select: jest.fn().mockReturnThis(),
          match: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ error: null }),
          count: jest.fn().mockReturnValue('exact'),
          head: jest.fn().mockResolvedValue(5)
        };
      } else if (table === 'lesson_requests') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { vote_count: 5 }, error: null }),
          update: jest.fn().mockReturnThis()
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ error: null })
      };
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createRouteHandlerClient as jest.Mock).mockImplementation(() => mockSupabase)
  })

  it('requires authentication', async () => {
    // Mock unauthenticated state
    mockSupabase.auth.getSession.mockResolvedValueOnce({ 
      data: { session: null }, 
      error: null 
    })

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
})
