import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/database';

export interface DatabaseResponse<T> {
  data: T | null;
  error: any | null;
  success?: boolean;
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
   */
  protected getServerClient() {
    try {
      return createServerComponentClient<Database>({ cookies });
    } catch (error) {
      console.error('Error creating server client:', error);
      // Fall back to client component client
      return this.getClient();
    }
  }

  /**
   * Execute a database operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: { maxRetries?: number; retryDelay?: number }
  ): Promise<DatabaseResponse<T>> {
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
    const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const data = await operation();
        return { data, error: null, success: true };
      } catch (error) {
        lastError = error as Error;
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
