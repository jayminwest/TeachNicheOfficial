import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { POST, GET } from '../requests/route'
import { createMockSupabaseClient, resetSupabaseMocks } from '../../../__mocks__/services/supabase'

// Mock createServerSupabaseClient
jest.mock('@/app/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockImplementation(() => {
    return createMockSupabaseClient();
  })
}))

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
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

  beforeEach(() => {
    jest.clearAllMocks()
    resetSupabaseMocks()
  })

  describe('POST /api/requests', () => {
    it('creates a new request when authenticated', async () => {
      // Mock successful request creation
      const mockSupabase = createMockSupabaseClient()
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      })
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: '123', title: 'Test Request' },
          error: null 
        })
      })

      // Mock both the route handler client and the server client
      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)

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
      
      const responseData = await response.json()
      expect(responseData).toEqual({ id: '123', title: 'Test Request' })
      
      // Verify correct data was inserted
      expect(mockSupabase.from).toHaveBeenCalledWith('lesson_requests')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Request',
        description: 'Test Description',
        category: 'Beginner Basics',
        user_id: 'test-user-id',
        status: 'open',
        vote_count: 0
      }))
    })

    it('rejects requests with missing required fields', async () => {
      const mockSupabase = createMockSupabaseClient()
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Missing description
      const request = new Request('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Request',
          category: 'Beginner Basics'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('error', 'Failed to create request')
    })

    it('requires authentication', async () => {
      const mockSupabase = createMockSupabaseClient()
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Request',
          description: 'Test Description',
          category: 'Beginner Basics'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('error', 'Unauthorized')
    })

    it('handles database errors gracefully', async () => {
      const mockSupabase = createMockSupabaseClient()
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      })
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null,
          error: { message: 'Database error' } 
        })
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Request',
          description: 'Test Description',
          category: 'Beginner Basics'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('error', 'Failed to create request')
    })

    it('handles unexpected exceptions', async () => {
      const mockSupabase = createMockSupabaseClient()
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      })
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Request',
          description: 'Test Description',
          category: 'Beginner Basics'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('error', 'Failed to create request')
    })
  })

  describe('GET /api/requests', () => {
    it('returns a list of requests', async () => {
      const mockRequests = [
        { id: '123', title: 'Request 1', created_at: '2023-01-01T00:00:00.000Z' },
        { id: '456', title: 'Request 2', created_at: '2023-01-02T00:00:00.000Z' }
      ]

      const mockSupabase = createMockSupabaseClient()
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockRequests,
          error: null
        })
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)
      
      const request = new Request('http://localhost/api/requests')
      
      const response = await GET(request)
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData).toEqual(mockRequests)
      
      // Verify correct query was built
      expect(mockSupabase.from).toHaveBeenCalledWith('lesson_requests')
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabase.from().order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('filters requests by category correctly', async () => {
      const mockRequests = [
        { id: '123', title: 'Request 1', category: 'Beginner Basics', created_at: '2023-01-01T00:00:00.000Z' }
      ]

      const mockSupabase = createMockSupabaseClient()
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockRequests,
          error: null
        })
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)
      
      const request = new Request('http://localhost/api/requests?category=Beginner%20Basics')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData).toEqual(mockRequests)
      
      // Verify category filter was applied
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('category', 'Beginner Basics')
    })

    it('filters requests by status correctly', async () => {
      const mockRequests = [
        { id: '123', title: 'Request 1', status: 'open', created_at: '2023-01-01T00:00:00.000Z' }
      ]

      const mockSupabase = createMockSupabaseClient()
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockRequests,
          error: null
        })
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)
      
      const request = new Request('http://localhost/api/requests?status=open')
      
      const response = await GET(request)
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData).toEqual(mockRequests)
      
      // Verify status filter was applied
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('status', 'open')
    })

    it('handles database errors gracefully', async () => {
      const mockSupabase = createMockSupabaseClient()
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
      require('@/app/lib/supabase/server').createServerSupabaseClient.mockReturnValue(mockSupabase)
      
      const request = new Request('http://localhost/api/requests')
      
      const response = await GET(request)
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData).toHaveProperty('error', 'Failed to fetch requests')
    })
  })
})
