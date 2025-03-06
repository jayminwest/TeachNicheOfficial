import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export async function createServerSupabaseClient() {
  // The cookies() function should be awaited
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore 
  });
}
