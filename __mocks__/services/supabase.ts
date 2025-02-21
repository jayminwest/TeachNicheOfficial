import { jest } from '@jest/globals';

const createSupabaseMock = () => {
  const mockFunctions = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      count: jest.fn().mockResolvedValue({ data: { count: 5 }, error: null })
    }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
    delete: jest.fn().mockResolvedValue({ data: null, error: null })
  };

  return {
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
      select: mockFunctions.select,
      insert: mockFunctions.insert,
      update: mockFunctions.update,
      delete: mockFunctions.delete,
    })),
    schema: jest.fn().mockReturnThis(),
  };
};

export const mockSupabaseClient = createSupabaseMock();

export const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
};
