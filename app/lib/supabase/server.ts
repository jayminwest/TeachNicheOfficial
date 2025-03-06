import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export async function createServerSupabaseClient() {
  // Get cookies instance first
  const cookieStore = cookies();
  
  // Pass the cookie store directly, not as a function
  return createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore
  });
}
