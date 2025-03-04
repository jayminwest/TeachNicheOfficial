import { createClientSupabaseClient } from '@/app/lib/supabase/client'

/**
 * Standard response type for auth operations
 */
export interface AuthResponse<T = unknown> {
  data: T | null
  error: Error | null
  success: boolean
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = createClientSupabaseClient()
    const { error } = await supabase.auth.signOut()
    
    return {
      data: null,
      error: error || null,
      success: !error
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to sign out'),
      success: false
    }
  }
}

/**
 * Gets the current session
 */
export async function getSession() {
  const supabase = createClientSupabaseClient()
  return supabase.auth.getSession()
}

/**
 * Sets up a listener for auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  const supabase = createClientSupabaseClient()
  
  // In test environment, return a mock subscription
  if (process.env.NODE_ENV === 'test') {
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }
  }
  
  try {
    return supabase.auth.onAuthStateChange(callback)
  } catch (error) {
    console.error('Error setting up auth state change listener:', error)
    // Return a mock subscription if the real one fails
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const supabase = createClientSupabaseClient()
    
    // Simplified redirect handling
    const redirectTo = `${window.location.origin}/auth/callback`
    
    // Use callbackUrl instead of redirect for Next.js compatibility
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')
    
    const options = {
      redirectTo: callbackUrl 
        ? `${redirectTo}?redirect_to=${encodeURIComponent(callbackUrl)}`
        : redirectTo,
      skipBrowserRedirect: false,
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options,
    })
    
    return {
      data,
      error: error || null,
      success: !error
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to sign in with Google'),
      success: false
    }
  }
}
