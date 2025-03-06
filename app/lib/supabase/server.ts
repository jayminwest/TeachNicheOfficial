import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export async function createServerSupabaseClient() {
  try {
    // Create a Supabase client with proper async cookie handling
    return createRouteHandlerClient<Database>({ 
      cookies
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
