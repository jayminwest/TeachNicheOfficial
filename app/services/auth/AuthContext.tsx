'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClientSupabaseClient } from '@/app/lib/supabase/client'

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
        const supabase = createClientSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
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
        const supabase = createClientSupabaseClient()
        const authStateChange = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id)
          
          // Handle auth state changes
          if (event === 'SIGNED_IN') {
            console.log('User signed in:', session?.user?.id)
            setUser(session?.user ?? null)
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out')
            setUser(null)
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed for user:', session?.user?.id)
            setUser(session?.user ?? null)
          } else if (event === 'USER_UPDATED') {
            console.log('User updated:', session?.user?.id)
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
