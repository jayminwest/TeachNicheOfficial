import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/database';

export function createServerSupabaseClient() {
  try {
    // Check for service role key (try both environment variable names)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.warn('No service role key found, falling back to anon key');
      // Fall back to anon key if service role key is not available
      return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    
    // Log the first few characters of the key for debugging (never log the full key)
    const keyPrefix = serviceRoleKey.substring(0, 5) + '...';
    console.log(`Using service role key for Supabase client: ${keyPrefix}`);
    console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // Use service role key for admin access that bypasses RLS
    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
