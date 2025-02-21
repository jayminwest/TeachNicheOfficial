import { jest } from '@jest/globals';

// Define mock user first since it's used in other mocks
export const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00.000Z',
  role: 'authenticated',
  updated_at: '2023-01-01T00:00:00.000Z'
};

// Create reusable mock data
const mockSession = {
  user: mockSupabaseUser,
  access_token: 'test-token',
  refresh_token: 'test-refresh-token'
};

// Define base types for query responses
type QueryResponse<T> = Promise<{ data: T | null; error: null | Error }>;
type QueryListResponse<T> = Promise<{ data: T[] | null; error: null | Error }>;

const mockQueryBuilder = {
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  overlap: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation((): QueryResponse<Record<string, any>> => 
    Promise.resolve({
      data: { id: 1, created_at: '2023-01-01T00:00:00.000Z' },
      error: null
    })
  ),
  maybeSingle: jest.fn().mockImplementation((): QueryResponse<Record<string, any>> => 
    Promise.resolve({
      data: { id: 1, created_at: '2023-01-01T00:00:00.000Z' },
      error: null
    })
  ),
  execute: jest.fn().mockImplementation((): QueryListResponse<Record<string, any>> => 
    Promise.resolve({
      data: [{ id: 1, created_at: '2023-01-01T00:00:00.000Z' }],
      error: null
    })
  ),
  count: jest.fn().mockImplementation(() => 
    Promise.resolve({
      data: [{ count: 5 }],
      error: null
    })
  )
};

export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({
      data: { user: mockSupabaseUser, session: mockSession },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: mockSupabaseUser, session: mockSession },
      error: null
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: mockSupabaseUser, session: mockSession },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    updateUser: jest.fn().mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null
    }),
    onAuthStateChange: jest.fn().mockImplementation((callback) => {
      callback('SIGNED_IN', { user: mockSupabaseUser });
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    })
  },

  from: jest.fn().mockImplementation((table) => ({
    ...mockQueryBuilder,
    insert: jest.fn().mockResolvedValue({
      data: [{ id: 1, created_at: '2023-01-01T00:00:00.000Z' }],
      error: null
    }),
    upsert: jest.fn().mockResolvedValue({
      data: [{ id: 1, created_at: '2023-01-01T00:00:00.000Z' }],
      error: null
    }),
    update: jest.fn().mockResolvedValue({
      data: { id: 1, updated_at: '2023-01-01T00:00:00.000Z' },
      error: null
    }),
    delete: jest.fn().mockResolvedValue({
      data: { id: 1 },
      error: null
    })
  })),

  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test.jpg' },
        error: null
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(['test']),
        error: null
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' }
      }),
      list: jest.fn().mockResolvedValue({
        data: [{ name: 'test.jpg' }],
        error: null
      }),
      remove: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed-test.jpg' },
        error: null
      }),
      move: jest.fn().mockResolvedValue({
        data: { path: 'new-test.jpg' },
        error: null
      })
    })
  },

  rpc: jest.fn().mockImplementation((func, params) => ({
    data: { result: 'success' },
    error: null
  }))
};
