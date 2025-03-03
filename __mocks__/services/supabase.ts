import { jest } from '@jest/globals';
import { createMockResponse, createAsyncMock, MockConfig, resetMocks } from '../utils/mock-helpers';

// Types for Supabase data
export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
  app_metadata: {
    provider: string;
    providers: string[];
  };
  aud: string;
  created_at: string;
  role: string;
  updated_at: string;
}

export interface SupabaseSession {
  user: SupabaseUser;
  access_token: string;
  refresh_token: string;
}

export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
}

// Query builder types
export interface QueryFilters {
  eq?: any;
  neq?: any;
  gt?: any;
  gte?: any;
  lt?: any;
  lte?: any;
  like?: string;
  ilike?: string;
  is?: any;
  in?: any[];
  contains?: any;
  containedBy?: any;
  range?: [any, any];
  overlap?: any[];
  [key: string]: any;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  order?: { column: string; ascending?: boolean };
  single?: boolean;
}

// Factory functions to create mock data
export const createMockUser = (overrides = {}): SupabaseUser => ({
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
  updated_at: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockSession = (overrides = {}): SupabaseSession => ({
  user: createMockUser(),
  access_token: 'test-token',
  refresh_token: 'test-refresh-token',
  ...overrides
});

export const createMockStorageFile = (overrides = {}): StorageFile => ({
  name: 'test.jpg',
  id: 'file_123',
  updated_at: '2023-01-01T00:00:00.000Z',
  created_at: '2023-01-01T00:00:00.000Z',
  last_accessed_at: '2023-01-01T00:00:00.000Z',
  metadata: {},
  ...overrides
});

// Create configurable query builder
// Mock data for RLS simulation
const mockData = {
  lessons: [
    { 
      id: 'lesson-1', 
      title: 'Public Lesson', 
      status: 'published', 
      creator_id: 'other-user-id',
      created_at: '2023-01-01T00:00:00.000Z'
    },
    { 
      id: 'lesson-2', 
      title: 'Private Lesson', 
      status: 'draft', 
      creator_id: 'test-user-id',
      created_at: '2023-01-02T00:00:00.000Z'
    }
  ],
  categories: [
    { id: 'cat-1', name: 'Category 1' },
    { id: 'cat-2', name: 'Category 2' }
  ],
  profiles: [
    { id: 'profile-1', user_id: 'test-user-id', role: 'user' }
  ],
  purchases: [
    { id: 'purchase-1', user_id: 'test-user-id', lesson_id: 'lesson-1' }
  ]
};

export const createMockQueryBuilder = (config: MockConfig = {}) => {
  let currentFilters: Record<string, any> = {};
  let currentTable: string = '';
  let currentUser: SupabaseUser | null = createMockUser();
  
  return {
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
    overlap: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    const baseData = { id: 'mock-id', created_at: '2023-01-01T00:00:00.000Z' };
    
    single: createAsyncMock(baseData, config),
    maybeSingle: createAsyncMock(baseData, config),
    execute: createAsyncMock([baseData], config),
    count: createAsyncMock([{ count: 5 }], config)
  };
};

// Create mock Supabase client with configurable behavior
export const createMockSupabaseClient = (config: MockConfig = {}) => {
  const mockUser = createMockUser();
  const mockSession = createMockSession();
  const mockFile = createMockStorageFile();
  const queryBuilder = createMockQueryBuilder(config);

  return {
    auth: {
      getSession: createAsyncMock({ session: mockSession }, config),
      getUser: createAsyncMock({ user: mockUser }, config),
      signInWithOAuth: createAsyncMock({ user: mockUser, session: mockSession }, config),
      signInWithPassword: createAsyncMock({ user: mockUser, session: mockSession }, config),
      signUp: createAsyncMock({ user: mockUser, session: mockSession }, config),
      signOut: createAsyncMock({}, config),
      resetPasswordForEmail: createAsyncMock({}, config),
      updateUser: createAsyncMock({ user: mockUser }, config),
      onAuthStateChange: jest.fn().mockImplementation((callback: any) => {
        callback('SIGNED_IN', { user: mockUser });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
      mfa: {
        enroll: createAsyncMock({ id: 'factor_123' }, config),
        challenge: createAsyncMock({ id: 'challenge_123' }, config),
        verify: createAsyncMock({ id: 'challenge_123' }, config),
        unenroll: createAsyncMock({}, config),
      }
    },

    from: jest.fn().mockImplementation((table) => ({
      ...queryBuilder,
      insert: createAsyncMock([{ id: 1, created_at: '2023-01-01T00:00:00.000Z' }], config),
      upsert: createAsyncMock([{ id: 1, created_at: '2023-01-01T00:00:00.000Z' }], config),
      update: createAsyncMock({ id: 1, updated_at: '2023-01-01T00:00:00.000Z' }, config),
      delete: createAsyncMock({ id: 1 }, config)
    })),

    storage: {
      from: jest.fn().mockReturnValue({
        upload: createAsyncMock({ path: 'test.jpg' }, config),
        download: createAsyncMock(new Blob(['test']), config),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' }
        }),
        list: createAsyncMock([mockFile], config),
        remove: createAsyncMock(null, config),
        createSignedUrl: createAsyncMock({ 
          signedUrl: 'https://example.com/signed-test.jpg',
          path: 'test.jpg',
          expiresIn: 3600 
        }, config),
        move: createAsyncMock({ path: 'new-test.jpg' }, config),
        copy: createAsyncMock({ path: 'copy-test.jpg' }, config)
      })
    },

    rpc: jest.fn().mockImplementation((func, params) => 
      createAsyncMock({ result: 'success' }, config)()
    ),
    
    // Additional utilities
    schema: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      execute: createAsyncMock({ definitions: [] }, config)
    }),
    
    // Functions for managing subscriptions
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockImplementation(() => {
        return { 
          unsubscribe: jest.fn() 
        };
      })
    })
  };
};

export const mockSupabaseClient = createMockSupabaseClient();

// Export function to reset all mocks
export const resetSupabaseMocks = () => resetMocks(mockSupabaseClient);
