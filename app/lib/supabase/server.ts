import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export async function createServerSupabaseClient() {
  // Create the client with the cookies function directly
  return createRouteHandlerClient<Database>({ 
    cookies
  });
}
