import { supabase } from '@/app/services/supabase'

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session?.user || null
}

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    return { data, error }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}


export const signUp = async (email: string, password: string) => {
  console.log('Attempting signup with email:', email)
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
