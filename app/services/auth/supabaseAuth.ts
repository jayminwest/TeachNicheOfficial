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

export const signInWithGoogle = async () => {
  try {
    const supabase = createClientSupabaseClient()
    
    // For local development, we need to specify the redirectTo
    // This ensures the OAuth flow returns to your local development server
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    console.log('Google sign-in initiated:', { data })
    
    if (error) {
      console.error('Google sign-in error:', error)
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
