import { jest } from '@jest/globals';

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

export const mockAuthContext = {
  user: mockUser,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshSession: jest.fn(),
};

export const mockUseAuth = jest.fn(() => mockAuthContext);
