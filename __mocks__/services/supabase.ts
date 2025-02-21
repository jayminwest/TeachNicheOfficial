import { jest } from '@jest/globals';

const createSupabaseMock = () => {
  const mockFunctions = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    match: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    limit: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    count: jest.fn(),
  };

  // Chain all methods to return the mock object
  const chainedMock = {
    ...mockFunctions,
    select: jest.fn().mockImplementation(() => chainedMock),
    eq: jest.fn().mockImplementation(() => chainedMock),
    match: jest.fn().mockImplementation(() => chainedMock),
    single: jest.fn().mockImplementation(() => Promise.resolve({ data: null })),
    maybeSingle: jest.fn().mockImplementation(() => Promise.resolve({ data: null })),
    limit: jest.fn().mockImplementation(() => chainedMock),
    order: jest.fn().mockImplementation(() => chainedMock),
    range: jest.fn().mockImplementation(() => chainedMock),
    count: jest.fn().mockImplementation(() => Promise.resolve({ data: { count: 5 } })),
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
      ...chainedMock,
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
