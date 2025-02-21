import { jest } from '@jest/globals';

export const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({
      data: { 
        session: {
          user: mockSupabaseUser,
          access_token: 'test-token',
          refresh_token: 'test-refresh-token'
        }
      },
      error: null
    }),
    onAuthStateChange: jest.fn().mockImplementation((callback) => {
      callback('SIGNED_IN', { user: mockSupabaseUser });
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
    getUser: jest.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null }),
  },
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
      download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      list: jest.fn().mockResolvedValue({ data: [{ name: 'test.jpg' }], error: null }),
      remove: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
  },
  from: jest.fn().mockImplementation((table) => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ 
        data: { id: 1, created_at: '2023-01-01T00:00:00.000Z' }, 
        error: null 
      }),
      maybeSingle: jest.fn().mockResolvedValue({ 
        data: { id: 1, created_at: '2023-01-01T00:00:00.000Z' }, 
        error: null 
      }),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue({ count: 5 }),
    }),
    insert: jest.fn().mockResolvedValue({ 
      data: [{ id: 1, created_at: '2023-01-01T00:00:00.000Z' }], 
      error: null 
    }),
    update: jest.fn().mockResolvedValue({ 
      data: { id: 1, updated_at: '2023-01-01T00:00:00.000Z' }, 
      error: null 
    }),
    delete: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    upsert: jest.fn().mockResolvedValue({ 
      data: [{ id: 1, created_at: '2023-01-01T00:00:00.000Z' }], 
      error: null 
    }),
  })),
  rpc: jest.fn().mockImplementation((func, params) => ({
    data: null,
    error: null
  })),
};

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
