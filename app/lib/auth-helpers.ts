'use client';

import { signInWithGoogle as supabaseSignInWithGoogle, signOut as supabaseSignOut } from '@/app/services/auth/supabaseAuth';

// Re-export the signInWithGoogle function from supabaseAuth
export const signInWithGoogle = supabaseSignInWithGoogle;

// Re-export the signOut function with the same interface as before
export async function signOut() {
  try {
    await supabaseSignOut();
    return { success: true };
  } catch (err) {
    console.error('Exception during sign out:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}
