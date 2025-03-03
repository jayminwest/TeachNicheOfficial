'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from './supabaseAuth'
import { createClientSupabaseClient } from '@/app/lib/supabase/client'

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
  type AuthState = {
    user: User | null;
    loading: boolean;
    error: Error | null;
  }
  
  const [authState, setAuthState] = useState<AuthState>({
    user: initialUser,
    loading: true,
    error: null
  })

  const isAuthenticated = !!authState.user
  
  // Use useCallback to memoize the function so it doesn't change on every render
  const setAuthStateTyped = useCallback((updater: (prev: AuthState) => AuthState) => {
    setAuthState((prevState) => updater(prevState));
  }, []);

  // Function to create or update user profile in the profiles table
  const createOrUpdateProfile = async (user: User) => {
    try {
      const supabase = createClientSupabaseClient();
      
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (!existingProfile) {
        // Create new profile if it doesn't exist
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: '',  // Initialize bio
          social_media_tag: '',  // Initialize social_media_tag
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log('Created new profile for user:', user.id);
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
    }
  };

  useEffect(() => {
    let isMounted = true
    let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} }

    // Check active sessions and sets the user
    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session } } = await getSession()
        
        if (session?.user) {
          // Create or update profile when initializing auth
          await createOrUpdateProfile(session.user);
        }
        
        if (isMounted) {
          setAuthStateTyped((prev) => ({
            ...prev,
            user: session?.user || null,
            loading: false
          }))
        }

        // Set up auth state change listener
        if (process.env.NODE_ENV !== 'test' && typeof window !== 'undefined') {
          const authStateChange = onAuthStateChange((event, session: { user?: User }) => {
            if (!isMounted) return
            
            // Handle auth state changes
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              setAuthStateTyped((prev) => ({
                ...prev,
                user: session?.user || null,
                loading: false
              }))
              
              // Create or update profile when user signs in
              if (event === 'SIGNED_IN' && session?.user) {
                createOrUpdateProfile(session.user);
              }
              
              // Handle redirect if needed
              if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search)
                const redirectTo = params.get('redirect')
                if (redirectTo) {
                  window.location.href = redirectTo
                }
              }
            } else if (event === 'SIGNED_OUT') {
              setAuthStateTyped((prev) => ({
                ...prev,
                user: null,
                loading: false
              }))
            }
          })
          
          if (authStateChange?.data?.subscription) {
            subscription = authStateChange.data.subscription
          }
        }
      } catch (error) {
        if (isMounted) {
          setAuthStateTyped((prev) => ({
            ...prev,
            user: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Authentication error')
          }))
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setAuthStateTyped]) // Add setAuthStateTyped to the dependency array

  return (
    <AuthContext.Provider value={{ 
      user: authState.user, 
      loading: authState.loading, 
      isAuthenticated,
      error: authState.error
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
