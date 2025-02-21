// Mock next/server before any other imports
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
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

// @ts-expect-error - Mocking global Request
global.Request = jest.fn().mockImplementation(mockRequest);

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
      getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null })
    }),
    rpc: jest.fn().mockResolvedValue({ error: null })
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
        requestId: '123',
        voteType: 'up'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('processes a valid vote request', async () => {
    const request = new Request('http://localhost/api/requests/vote', {
      method: 'POST',
      body: JSON.stringify({
        requestId: '123',
        voteType: 'up'
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toEqual({ success: true })
  })
})
