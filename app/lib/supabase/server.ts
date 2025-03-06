import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/database';

export async function createServerSupabaseClient() {
  try {
    // Create a custom cookie handler that properly awaits cookie operations
    const cookieStore = cookies();
    
    // Create the Supabase client with a custom cookie handler
    return createRouteHandlerClient<Database>({
      cookies: () => {
        return {
          get: async (name: string) => {
            const cookie = cookieStore.get(name);
            return cookie;
          },
          getAll: async () => {
            return cookieStore.getAll();
          },
          set: () => {}, // Not used in route handlers
          remove: () => {}, // Not used in route handlers
        };
      },
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}
