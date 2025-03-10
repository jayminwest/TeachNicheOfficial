import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/database';
import { PostgrestError } from '@supabase/supabase-js';

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

export class DatabaseService {
  protected defaultMaxRetries = 3;
  protected defaultRetryDelay = 300; // ms

  /**
   * Get a Supabase client
   */
  protected getClient() {
    // Use client component client by default
    return createClientComponentClient<Database>();
  }

  /**
   * Get a server-side Supabase client
   * Note: This method should only be called from server components
   * and is not available in client components
   */
  protected getServerClient() {
    // This is a placeholder that will be overridden in server contexts
    console.warn('getServerClient() called from client component');
    return this.getClient();
  }

  /**
   * Execute a database operation with retry logic
   * @param operation Function that returns a Promise with Supabase response format { data, error }
   * @param options Optional configuration for retries
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null, error: PostgrestError | null }>,
    options?: { maxRetries?: number; retryDelay?: number }
  ): Promise<DatabaseResponse<T>> {
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
    const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await operation();
        
        // If Supabase returns an error, handle it based on error type
        if (response.error) {
          const errorCode = response.error.code;
          
          // Don't retry permission errors, invalid input, or constraint violations
          if (
            errorCode === 'PGRST301' || // Permission denied
            errorCode === 'PGRST302' || // Invalid input
            errorCode === '23505'       // Unique violation
          ) {
            return {
              data: null,
              error: new Error(response.error.message),
              success: false
            };
          }
          
          // For other errors, retry if we haven't exceeded max retries
          lastError = new Error(response.error.message);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
            continue;
          }
        }
        
        // Success case
        return { 
          data: response.data, 
          error: null, 
          success: true 
        };
      } catch (error) {
        // Handle unexpected errors
        if (error instanceof Error) {
          lastError = error;
        } else {
          lastError = new Error('Unknown database error');
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    return {
      data: null,
      error: lastError,
      success: false
    };
  }
}
