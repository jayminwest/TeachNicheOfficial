import { jest } from '@jest/globals';

export const mockUser = {
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
  updated_at: '2023-01-01T00:00:00.000Z'
};

export const mockAuthContext = {
  user: mockUser,
  loading: false,
  signIn: jest.fn().mockResolvedValue({ user: mockUser, session: null }),
  signOut: jest.fn().mockResolvedValue({}),
  refreshSession: jest.fn().mockResolvedValue({ user: mockUser }),
  isAuthenticated: true,
  profile: {
    id: 'profile-1',
    user_id: 'test-user-id',
    username: 'testuser',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg'
  }
};

export const mockUseAuth = jest.fn(() => mockAuthContext);
