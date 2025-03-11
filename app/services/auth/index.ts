import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

/**
 * Gets the current authenticated user
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Re-export the AuthContext components
export { AuthContext, AuthProvider, useAuth } from './AuthContext';
