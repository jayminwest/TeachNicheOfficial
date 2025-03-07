import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

// Use a direct Supabase client approach to avoid cookie issues
export function createServerSupabaseClient() {
  try {
    // Use direct client to avoid cookie issues in production
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
