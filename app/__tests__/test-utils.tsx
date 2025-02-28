import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthContext } from '@/app/services/auth/AuthContext'
import { User } from 'firebase/auth'

// Mock user for testing
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  metadata: {
    creatorProfile: true
  },
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.png',
  emailVerified: true,
  isAnonymous: false,
  providerData: [{
    providerId: 'email',
    uid: 'test@example.com',
    displayName: 'Test User',
    email: 'test@example.com',
    phoneNumber: null,
    photoURL: 'https://example.com/avatar.png'
  }],
  getIdToken: () => Promise.resolve('mock-token'),
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: () => Promise.resolve(),
  reload: () => Promise.resolve(),
  toJSON: () => ({})
} as unknown as User

interface AuthProviderProps {
  user?: User | null
  loading?: boolean
  isAuthenticated?: boolean
}

// Default auth context values
const defaultAuthValues: AuthProviderProps = {
  user: mockUser,
  loading: false,
  isAuthenticated: true
}

// Render with auth context wrapper
export function renderWithAuth(
  ui: React.ReactElement,
  authProps: AuthProviderProps = defaultAuthValues,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => {
      // Ensure we never pass undefined to the context
      const user = authProps.user !== undefined ? authProps.user : defaultAuthValues.user;
      const loading = authProps.loading !== undefined ? authProps.loading : defaultAuthValues.loading;
      const isAuthenticated = authProps.isAuthenticated !== undefined ? authProps.isAuthenticated : defaultAuthValues.isAuthenticated;
      
      return (
        <AuthContext.Provider
          value={{
            user: user as User | null, // Force the correct type
            loading: loading as boolean,
            isAuthenticated: isAuthenticated as boolean,
            isCreator: () => Boolean(user?.metadata?.creatorProfile || user?.metadata?.is_creator)
          }}
        >
          {children}
        </AuthContext.Provider>
      );
    },
    ...options
  })
}
