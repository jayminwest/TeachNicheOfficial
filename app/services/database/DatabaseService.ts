/**
 * Simplified DatabaseService base class
 * This provides a minimal implementation to maintain compatibility with existing code
 */

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

export class DatabaseService {
  protected defaultMaxRetries = 3;
  protected defaultRetryDelay = 500; // ms

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

  /**
   * Create a successful database response
   */
  protected createSuccessResponse<T>(data: T): DatabaseResponse<T> {
    return {
      data,
      error: null,
      success: true
    };
  }

  /**
   * Create an error database response
   */
  protected createErrorResponse<T>(error: Error): DatabaseResponse<T> {
    return {
      data: null,
      error,
      success: false
    };
  }
}
