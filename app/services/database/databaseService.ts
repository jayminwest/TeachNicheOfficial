import { createClientSupabaseClient } from '@/app/lib/supabase/client'
import { PostgrestError } from '@supabase/supabase-js'

export interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
  success: boolean
}

/**
 * Base class for database operations with error handling and retry logic
 */
export class DatabaseService {
  private maxRetries = 3;
  private retryDelay = 1000; // ms
  
  /**
   * Execute a database operation with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null, error: PostgrestError | null }>,
    retries = this.maxRetries
  ): Promise<DatabaseResponse<T>> {
    try {
      let currentTry = 0;
      
      while (currentTry <= retries) {
        const { data, error } = await operation();
        
        if (!error) {
          return {
            data,
            error: null,
            success: true
          };
        }
        
        // Don't retry on permission errors or invalid inputs
        if (error.code === 'PGRST301' || error.code === 'PGRST302' || error.code === '23505') {
          return {
            data: null,
            error: new Error(error.message),
            success: false
          };
        }
        
        // Retry on connection errors or timeouts
        if (currentTry < retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          currentTry++;
          continue;
        }
        
        return {
          data: null,
          error: new Error(error.message),
          success: false
        };
      }
      
      // This should never happen, but TypeScript needs it
      return {
        data: null,
        error: new Error('Maximum retries exceeded'),
        success: false
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Unknown database error'),
        success: false
      };
    }
  }
  
  /**
   * Get the Supabase client
   */
  protected getClient() {
    return createClientSupabaseClient();
  }
}
