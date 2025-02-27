import { TypedSupabaseClient } from './supabase';

// Create a separate interface for our custom RPC functions
export interface ExtendedSupabaseClient {
  rpc<T = unknown>(
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

// Combine the TypedSupabaseClient with our ExtendedSupabaseClient
export type EnhancedSupabaseClient = TypedSupabaseClient & ExtendedSupabaseClient;

/**
 * Adds RPC capabilities to a Supabase client
 * 
 * @param client The Supabase client to extend
 * @returns The extended client with RPC capabilities
 */
export const addRpcToClient = (client: TypedSupabaseClient): EnhancedSupabaseClient => {
  // Cast the client to the enhanced type
  // This is safe because we're not actually changing the implementation,
  // just providing a more specific type for TypeScript
  return client as unknown as EnhancedSupabaseClient;
};
