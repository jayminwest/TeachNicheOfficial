import { jest } from '@jest/globals';

export const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    onAuthStateChange: jest.fn(),
    getUser: jest.fn(),
  },
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    download: jest.fn(),
    getPublicUrl: jest.fn(),
    list: jest.fn(),
  },
  from: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue({ data: { count: 5 } }),
    }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
    delete: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  schema: jest.fn().mockReturnThis(),
};

export const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
};
