import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/database';

export function createServerSupabaseClient() {
  try {
    // Check for service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined, falling back to anon key');
      // Fall back to anon key if service role key is not available
      return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    
    console.log('Using service role key for Supabase client');
    
    // Use service role key for admin access that bypasses RLS
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        }
      }
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
