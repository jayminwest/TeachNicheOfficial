import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { POST, GET } from '../requests/route'

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
}))
jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => []
  })
}))

// Mock Request and Response globals that would be available in Node environment
global.Request = class Request {
  constructor(input: string | Request, init?: RequestInit) {
    return new (require('whatwg-fetch').Request)(input, init)
  }
} as typeof Request

describe('Requests API Routes', () => {
  const mockSession = {
    user: { id: 'test-user-id' }
  }

  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } })
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ 
        data: { id: '123', title: 'Test Request' },
        error: null 
      }),
      order: jest.fn().mockResolvedValue({
        data: [{ id: '123', title: 'Test Request' }],
        error: null
      })
    })
  }

  beforeEach(() => {
    (createRouteHandlerClient as jest.Mock).mockReset()
    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('POST /api/requests', () => {
    it('creates a new request when authenticated', async () => {
      const request = new Request('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Request',
          description: 'Test Description',
          category: 'Beginner Fundamentals'
        })
      })

      const response = await POST(request)
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/requests', () => {
    it('returns a list of requests', async () => {
      const request = new Request('http://localhost/api/requests')
      
      const response = await GET(request)
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
    })
  })
})
