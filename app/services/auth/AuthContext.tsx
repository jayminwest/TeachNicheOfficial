'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from './supabaseAuth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
})

export function AuthProvider({ 
  children, 
  initialUser = null 
}: { 
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(true)
  const isAuthenticated = !!user

  useEffect(() => {
    // Check active sessions and sets the user
    async function getInitialSession() {
      try {
        console.log('AuthContext: Getting initial session')
        const { data: { session } } = await getSession()
        console.log('AuthContext: Initial session result:', !!session)
        
        if (session?.user) {
          console.log('AuthContext: User found in session:', session.user.id)
          setUser(session.user)
        } else {
          console.log('AuthContext: No user in session')
          setUser(null)
        }
        setLoading(false)
      } catch (error) {
        console.error('AuthContext: Error getting initial session:', error)
        setUser(null)
        setLoading(false)
      }
    }

    getInitialSession()

    // Handle auth state changes
    let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} }
        
    try {
      // In test environment, we might not have all Supabase methods available
      if (process.env.NODE_ENV === 'test') {
        // Mock subscription for tests
        setLoading(false)
      } else if (typeof window !== 'undefined') {
        const authStateChange = onAuthStateChange(async (event, session) => {
          console.log('AuthContext: Auth state changed:', event, session?.user?.id)
              
          // Handle auth state changes
          if (event === 'SIGNED_IN') {
            console.log('AuthContext: User signed in:', session?.user?.id)
            setUser(session?.user ?? null)
                
            // Check if there's a redirect URL in the query params
            if (typeof window !== 'undefined') {
              const params = new URLSearchParams(window.location.search);
              const redirectTo = params.get('redirect');
              if (redirectTo) {
                window.location.href = redirectTo;
              }
            }
                
            // Don't force a refresh - let the router handle navigation
            // This prevents issues with the auth flow
          } else if (event === 'SIGNED_OUT') {
            console.log('AuthContext: User signed out')
            setUser(null)
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('AuthContext: Token refreshed for user:', session?.user?.id)
            setUser(session?.user ?? null)
          } else if (event === 'USER_UPDATED') {
            console.log('AuthContext: User updated:', session?.user?.id)
            setUser(session?.user ?? null)
          }
              
          setLoading(false)
        })
        
        if (authStateChange && authStateChange.data && authStateChange.data.subscription) {
          subscription = authStateChange.data.subscription
        }
      } else {
        // Fallback if method is not available
        console.warn('Auth state change listener not available')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
