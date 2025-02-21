import { jest } from '@jest/globals';

export const mockAuthContext = {
  user: null,
  loading: true,
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshSession: jest.fn(),
};

export const mockUseAuth = () => mockAuthContext;
