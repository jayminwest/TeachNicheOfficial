import { Database } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';

// Extend the TypedSupabaseClient to include our custom RPC functions
export interface ExtendedSupabaseClient extends SupabaseClient<Database> {
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
