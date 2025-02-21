import { jest } from '@jest/globals';
import { createAsyncMock, MockConfig, resetMocks } from '../utils/mock-helpers';

// Types for auth data
export interface MockUser {
  id: string;
  email: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
  aud: string;
  created_at: string;
  role: string;
  updated_at: string;
}

export interface MockProfile {
  id: string;
  user_id: string;
  username: string;
  bio: string;
  avatar_url: string;
}

export interface MockSession {
  user: MockUser;
  access_token: string;
  refresh_token: string;
}

// Factory functions to create mock data
export const createMockUser = (overrides = {}): MockUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00.000Z',
  role: 'authenticated',
  updated_at: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockProfile = (overrides = {}): MockProfile => ({
  id: 'profile-1',
  user_id: 'test-user-id',
  username: 'testuser',
  bio: 'Test bio',
  avatar_url: 'https://example.com/avatar.jpg',
  ...overrides
});

export const createMockSession = (overrides = {}): MockSession => ({
  user: createMockUser(),
  access_token: 'test-token',
  refresh_token: 'test-refresh-token',
  ...overrides
});

// Create mock auth context with configurable behavior
export const createMockAuthContext = (config: MockConfig = {}) => {
  const mockUser = createMockUser();
  const mockProfile = createMockProfile();
  const mockSession = createMockSession();

  return {
    user: mockUser,
    loading: false,
    signIn: createAsyncMock({ user: mockUser, session: mockSession }, config),
    signOut: createAsyncMock({}, config),
    refreshSession: createAsyncMock({ user: mockUser }, config),
    isAuthenticated: true,
    profile: mockProfile,
    updateProfile: createAsyncMock({ success: true }, config),
    deleteAccount: createAsyncMock({ success: true }, config)
  };
};

export const mockAuthContext = createMockAuthContext();
export const mockUseAuth = jest.fn(() => mockAuthContext);

// Export function to reset all mocks
export const resetAuthMocks = () => resetMocks(mockAuthContext);
