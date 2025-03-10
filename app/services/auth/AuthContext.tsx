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
    
    console.log('AuthContext initializing...')
    
    // Add safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading safety timeout triggered after 2 seconds')
        setLoading(false)
        setUser(null) // Ensure user is null if timeout occurs
        console.log('Auth state reset due to timeout')
      }
    }, process.env.NODE_ENV === 'test' ? 100 : 2000) // Use shorter timeout in tests

    // Check active sessions and sets the user
    async function initializeAuth() {
      try {
        console.log('Getting initial session...')
        // Get initial session
        const { data: { session }, error: sessionError } = await getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          throw sessionError
        }
        
        console.log('Session retrieved:', session ? 'Valid session' : 'No session')
        
        if (session?.user && isMounted) {
          console.log('Setting user from session')
          setUser(session.user)
          // Handle profile creation in a separate service
          try {
            await createOrUpdateProfile(session.user)
            console.log('Profile created/updated successfully')
          } catch (profileError) {
            console.error('Error creating/updating profile:', profileError)
            // Continue even if profile creation fails
          }
        } else {
          console.log('No user in session')
        }
        
        if (isMounted) {
          console.log('Setting loading to false after session check')
          setLoading(false)
        }

        // Set up auth state change listener
        if (typeof window !== 'undefined') {
          const authStateChange = onAuthStateChange(async (event, session: { user?: User }) => {
            if (!isMounted) return
            
            try {
              // Handle auth state changes
              if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user)
                await createOrUpdateProfile(session.user).catch(err => 
                  console.error('Profile creation error during auth change:', err)
                )
                
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
            } catch (error) {
              console.error('Error during auth state change:', error)
            } finally {
              if (isMounted) {
                setLoading(false)
              }
            }
          })
          
          if (authStateChange?.data?.subscription) {
            subscription = authStateChange.data.subscription
          }
        }
      } catch (error) {
        console.error('Authentication initialization error:', error)
        if (isMounted) {
          setUser(null)
          setError(error instanceof Error ? error : new Error('Authentication error'))
          setLoading(false)
          console.log('Auth state reset due to error')
        }
      }
    }

    initializeAuth()

    return () => {
      console.log('AuthContext cleanup')
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [loading])

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
