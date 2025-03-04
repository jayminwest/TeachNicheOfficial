'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from './supabaseAuth'
import { createOrUpdateProfile } from '../profile/profileService'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  error: Error | null
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  error: null
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
  const [error, setError] = useState<Error | null>(null)
  
  const isAuthenticated = !!user

  useEffect(() => {
    let isMounted = true
    let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} }

    // Check active sessions and sets the user
    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session } } = await getSession()
        
        if (session?.user && isMounted) {
          setUser(session.user)
          // Handle profile creation in a separate service
          await createOrUpdateProfile(session.user)
        }
        
        if (isMounted) {
          setLoading(false)
        }

        // Set up auth state change listener
        if (process.env.NODE_ENV !== 'test' && typeof window !== 'undefined') {
          const authStateChange = onAuthStateChange(async (event, session: { user?: User }) => {
            if (!isMounted) return
            
            // Handle auth state changes
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user)
              await createOrUpdateProfile(session.user)
              
              // Handle redirect if needed
              if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search)
                const redirectTo = params.get('redirect')
                if (redirectTo) {
                  window.location.href = redirectTo
                }
              }
            } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              if (session?.user) {
                setUser(session.user)
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
            }
            
            if (isMounted) {
              setLoading(false)
            }
          })
          
          if (authStateChange?.data?.subscription) {
            subscription = authStateChange.data.subscription
          }
        }
      } catch (error) {
        if (isMounted) {
          setUser(null)
          setError(error instanceof Error ? error : new Error('Authentication error'))
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated,
      error
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
