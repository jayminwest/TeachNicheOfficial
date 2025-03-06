import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export async function createServerSupabaseClient() {
  try {
    // Create the client with a cookie store to avoid async issues
    const cookieStore = cookies();
    
    // Create a custom cookies function that properly handles the cookies
    const customCookies = () => {
      return {
        get: (name: string) => {
          return cookieStore.get(name);
        },
        getAll: () => cookieStore.getAll()
      };
    };
    
    return createRouteHandlerClient<Database>({ 
      cookies: customCookies
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
