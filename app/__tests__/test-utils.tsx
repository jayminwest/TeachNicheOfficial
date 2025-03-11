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
  error?: Error | null
}

// Default auth context values
const defaultAuthValues: AuthProviderProps = {
  user: mockUser,
  loading: false,
  isAuthenticated: true,
  error: null
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
      const error = authProps.error !== undefined ? authProps.error : defaultAuthValues.error;
      
      return (
        <AuthContext.Provider
          value={{
            user: user as User | null,
            loading: loading as boolean,
            isAuthenticated: isAuthenticated as boolean,
            error: error || null
          }}
        >
          {children}
        </AuthContext.Provider>
      );
    },
    ...options
  })
}
