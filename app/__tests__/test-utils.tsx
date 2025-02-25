import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthContext } from '@/app/services/auth/AuthContext'
import { User } from '@supabase/supabase-js'

// Mock user for testing
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.png'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString()
}

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
    wrapper: ({ children }) => (
      <AuthContext.Provider
        value={{
          user: authProps.user !== undefined ? authProps.user : defaultAuthValues.user,
          loading: authProps.loading !== undefined ? authProps.loading : defaultAuthValues.loading,
          isAuthenticated: authProps.isAuthenticated !== undefined ? authProps.isAuthenticated : defaultAuthValues.isAuthenticated
        }}
      >
        {children}
      </AuthContext.Provider>
    ),
    ...options
  })
}
