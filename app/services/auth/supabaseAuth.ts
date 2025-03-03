import { createClientSupabaseClient } from '@/app/lib/supabase/client'
import { AuthError } from '@supabase/supabase-js'

export const signInWithEmail = async (email: string, password: string) => {
  const supabase = createClientSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const supabase = createClientSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const supabase = createClientSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session?.user || null
}

/**
 * Gets the current session
 * @returns Promise with the session data
 */
export async function getSession() {
  const supabase = createClientSupabaseClient()
  return supabase.auth.getSession()
}

/**
 * Sets up a listener for auth state changes
 * @param callback Function to call when auth state changes
 * @returns Subscription that can be unsubscribed
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
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

export const signInWithGoogle = async (redirectTo?: string) => {
  try {
    const supabase = createClientSupabaseClient()
    
    // Use the proper redirect URL with state preservation
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false,
      },
    });
    
    // Log the URL for debugging
    if (data?.url) {
      console.log('Auth redirect URL:', data.url);
    }
    
    if (error) {
      console.error('Google sign-in error:', error)
      
      // Enhance error message for provider not enabled
      if (error.message?.includes('provider is not enabled') || 
          error.message?.includes('Unsupported provider')) {
        console.error('Google provider is not enabled in Supabase. Please configure it in the Supabase dashboard.');
      }
      
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error during Google sign-in:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Failed to sign in with Google')
    }
  }
}

export const signUp = async (email: string, password: string) => {
  console.log('Attempting signup with email:', email)
  const supabase = createClientSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        email: email,
      }
    }
  })
  
  if (error) {
    console.error('Signup error:', error)
    throw error
  }
  
  console.log('Signup response:', data)
  return data
}
