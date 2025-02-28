'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from 'firebase/auth'
import { app, getAuth as getFirebaseAuth } from '@/app/lib/firebase'

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

// We'll initialize auth in useEffect to ensure it only runs on the client

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
    // Only run in browser environment
    if (typeof window === 'undefined') {
      setLoading(false);
      return () => {};
    }
    
    // For tests with initialUser, update the user state
    if (initialUser !== undefined) {
      setUser(initialUser);
      setLoading(false);
      // If initialUser is provided, we don't need to set up the auth listener
      if (initialUser !== null) {
        return () => {};
      }
    }
    
    // Dynamically import Firebase auth to avoid server-side issues
    const initializeAuth = async () => {
      try {
        // First try to get auth from our helper function
        let authInstance = getFirebaseAuth();
        
        // If that fails, initialize it directly
        if (!authInstance) {
          const { getAuth } = await import('firebase/auth');
          authInstance = getAuth(app);
        }
        
        // Set up auth state change listener
        const { onAuthStateChanged } = await import('firebase/auth');
        const unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
          if (firebaseUser) {
            // Use the Firebase User directly
            setUser(firebaseUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        
        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };
    
    // Initialize auth and store the unsubscribe function
    let unsubscribe: (() => void) | undefined;
    initializeAuth().then(cleanupFn => {
      unsubscribe = cleanupFn;
    });
    
    // Cleanup subscription
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialUser]);

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
