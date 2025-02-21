import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { POST } from '../requests/vote/route'

// Mock global Request and Response
global.Request = class Request {
  url: string
  method: string
  body: string
  constructor(url: string, init?: RequestInit) {
    this.url = url
    this.method = init?.method || 'GET'
    this.body = init?.body as string
  }

  async json() {
    return JSON.parse(this.body)
  }
} as unknown as typeof Request

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs')
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
    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
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
