'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import authService from './auth-provider'

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
        const currentUser = await authService.getCurrentUser();
        // Convert AuthUser to User format for compatibility
        setUser(currentUser ? {
          id: currentUser.id,
          email: currentUser.email,
          user_metadata: {
            full_name: currentUser.name || '',
            avatar_url: currentUser.avatarUrl || ''
          },
          app_metadata: {
            provider: 'firebase',
            providers: ['firebase']
          }
        } as User : null);
        setLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const handleAuthChange = () => {
      // This would be replaced with proper listeners for each auth provider
      // For now, we'll just check the current user periodically
      const checkInterval = setInterval(async () => {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            user_metadata: {
              full_name: currentUser.name || '',
              avatar_url: currentUser.avatarUrl || ''
            },
            app_metadata: {
              provider: 'firebase',
              providers: ['firebase']
            }
          } as User);
        } else {
          setUser(null);
        }
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(checkInterval);
    };
    
    const cleanup = handleAuthChange();
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
