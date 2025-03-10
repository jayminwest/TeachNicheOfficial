import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { createClientSupabaseClient } from '@/app/lib/supabase/client';
import { Database } from '@/app/types/database';

/**
 * Standard response format for database operations
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

/**
 * Base service class for database operations
 * Provides common functionality for all database services
 */
export abstract class DatabaseService {
  protected supabase: SupabaseClient<Database>;
  protected defaultMaxRetries = 3;
  protected defaultRetryDelay = 300; // ms

  constructor() {
    this.supabase = this.getClient();
  }
  
  /**
   * Get the Supabase client
   * This method exists primarily to allow mocking in tests
   */
  protected getClient(): SupabaseClient<Database> {
    return createClientSupabaseClient();
  }

  /**
   * Execute a database operation with retry logic
   * @param operation The database operation to execute
   * @param options Optional configuration for retries
   * @returns A standardized DatabaseResponse
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null; error: Error | PostgrestError | null }>,
    options?: { maxRetries?: number; retryDelay?: number }
  ): Promise<DatabaseResponse<T>> {
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
    const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await operation();
        
        if (response.error) {
          // If there's an error in the response, convert it to an Error object
          if (response.error instanceof Error) {
            lastError = response.error;
          } else if (typeof response.error === 'object' && response.error !== null && 'message' in response.error) {
            // Use type assertion to tell TypeScript that message exists
            const errorObj = response.error as { message: unknown };
            lastError = new Error(String(errorObj.message) || 'Unknown database error');
          } else {
            lastError = new Error('Unknown database error');
          }
          
          // Only retry on connection errors, not on permission or validation errors
          const shouldRetry = response.error instanceof Error || 
            (typeof response.error === 'object' && 
             response.error !== null && 
             (!('code' in response.error) || 
              (response.error.code !== 'PGRST301' && 
               response.error.code !== 'PGRST302' && 
               response.error.code !== '23505')));
               
          if (shouldRetry) {
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
              continue;
            }
          }
          
          return {
            data: null,
            error: lastError,
            success: false
          };
        }
        
        return { 
          data: response.data, 
          error: null, 
          success: true 
        };
      } catch (error) {
        lastError = error instanceof Error 
          ? error 
          : new Error(String(error) || 'Unknown database error');
          
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
      }
    }
    
    return {
      data: null,
      error: lastError,
      success: false
    };
  }

  /**
   * Format a database error into a standardized response
   * @param error The error to format
   * @param context Additional context for the error
   * @returns A standardized DatabaseResponse
   */
  protected formatError<T>(error: unknown, context: string): DatabaseResponse<T> {
    const formattedError = error instanceof Error 
      ? error 
      : new Error(`${context}: ${String(error)}`);
    
    return {
      data: null,
      error: formattedError,
      success: false
    };
  }
}
