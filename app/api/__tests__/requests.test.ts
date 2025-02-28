import { POST, GET } from '../requests/route'
import { createRouteHandlerClient } from '@/app/lib/firebase/client'

// Mock dependencies
jest.mock('@/app/lib/firebase/client', () => ({
  createRouteHandlerClient: jest.fn(),
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null })
  }
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(data), init)
      Object.defineProperty(response, 'status', {
        get() {
          return init?.status || 200
        }
      })
      return response
    }
  }
}))
jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => []
  })
}))

// Mock Request and Response globals that would be available in Node environment
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
      eq: jest.fn().mockReturnThis(),
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
          category: 'Beginner Basics'
        })
      })

      const response = await POST(request)
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/requests', () => {
    it('returns a list of requests', async () => {
      const request = new Request('http://localhost/api/requests')
      
      const response = await GET(request)
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
    })
  })
})
