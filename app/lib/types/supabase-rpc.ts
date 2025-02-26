import { Database } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { TypedSupabaseClient } from './supabase';

// Extend the TypedSupabaseClient to include our custom RPC functions
export interface ExtendedSupabaseClient extends TypedSupabaseClient {
  rpc<T = any>(
    fn: string,
    params?: object,
    options?: {
      head?: boolean;
      count?: null | 'exact' | 'planned' | 'estimated';
    }
  ): Promise<{
    data: T;
    error: Error | null;
  }>;
}

/**
 * Adds RPC capabilities to a Supabase client
 * 
 * @param client The Supabase client to extend
 * @returns The extended client with RPC capabilities
 */
export const addRpcToClient = (client: TypedSupabaseClient): ExtendedSupabaseClient => {
  // Cast the client to the extended type
  // This is safe because we're not actually changing the implementation,
  // just providing a more specific type for TypeScript
  return client as unknown as ExtendedSupabaseClient;
};
