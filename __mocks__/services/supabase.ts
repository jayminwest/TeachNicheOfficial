import { jest } from '@jest/globals';

export const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
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
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
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
