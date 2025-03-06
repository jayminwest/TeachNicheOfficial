import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export async function createServerSupabaseClient() {
  // Create the client with a cookie store to avoid async issues
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore
  });
}
