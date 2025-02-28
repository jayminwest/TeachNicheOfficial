'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, getAuth, onAuthStateChanged } from 'firebase/auth'
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

// Initialize Firebase Auth - this is safe because this is a client component ('use client')
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
        // Use the Firebase User directly
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [])

  const isCreator = useCallback(() => {
    // Check if the user has a creator profile in their custom claims or metadata
    const metadata = user?.metadata as Record<string, unknown> | undefined;
    const customClaims = (user as { customClaims?: Record<string, unknown> })?.customClaims;
    
    return metadata?.creatorProfile === true || 
           metadata?.is_creator === true ||
           customClaims?.is_creator === true;
  }, [user]);

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
