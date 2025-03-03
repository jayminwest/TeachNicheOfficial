'use client';

import { createClientSupabaseClient } from './supabase/client';

export async function signInWithGoogle(redirectTo?: string) {
  try {
    const supabase = createClientSupabaseClient();
    
    // Use the proper redirect URL
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    return { success: true };
  } catch (err) {
    console.error('Exception during sign in:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}

export async function signOut() {
  try {
    const supabase = createClientSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    
    return { success: true };
  } catch (err) {
    console.error('Exception during sign out:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}
