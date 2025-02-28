'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from 'firebase/auth'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { app } from '@/app/lib/firebase'

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

// Initialize Firebase Auth
const auth = getAuth(app);

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
    // Set up auth state change listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to User format for compatibility
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          user_metadata: {
            full_name: firebaseUser.displayName || '',
            avatar_url: firebaseUser.photoURL || ''
          },
          app_metadata: {
            provider: 'firebase',
            providers: ['firebase']
          }
        } as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [])

  const isCreator = useCallback(() => {
    return user?.metadata?.is_creator === true || 
           user?.metadata?.is_creator === true;
  }, [user?.metadata?.is_creator, user?.metadata?.is_creator]);

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
