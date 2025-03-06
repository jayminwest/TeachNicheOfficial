import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export function createServerSupabaseClient() {
  // Pass cookies as a function reference
  return createRouteHandlerClient<Database>({ 
    cookies
  });
}
