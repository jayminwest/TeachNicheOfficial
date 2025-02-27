'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/app/services/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isCreator: () => boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isCreator: () => false,
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
      } else if (supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
        const authStateChange = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id)
          setUser(session?.user ?? null)
          setLoading(false)
          
          // Broadcast auth change to other tabs
          if (typeof window !== 'undefined' && window.localStorage) {
            const authChangeEvent = new Date().toISOString();
            localStorage.setItem('auth_state_change', authChangeEvent);
          }
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
    
    // Listen for auth changes in other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_state_change') {
        // Refresh auth state when another tab changes it
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    }
  }, [])

  const isCreator = useCallback(() => {
    return user?.user_metadata?.is_creator === true || 
           user?.app_metadata?.is_creator === true;
  }, [user?.user_metadata?.is_creator, user?.app_metadata?.is_creator]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isCreator }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Helper function to detect if we're in a test environment
export function isTestEnvironment() {
  return typeof window !== 'undefined' && 
    (process.env.NODE_ENV === 'test' || 
     window.location.href.includes('localhost') || 
     window.location.href.includes('127.0.0.1'));
}
