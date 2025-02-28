/**
 * Database Service Interface
 * 
 * This file defines the interface for database services.
 */

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseService {
  query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  
  getCategories(): Promise<{id: string; name: string; description?: string; created_at?: string; updated_at?: string}[]>;
  
  getLessons(
    limit?: number, 
    offset?: number, 
    filters?: Record<string, string | number | boolean>
  ): Promise<Record<string, unknown>[]>;
  
  create<T = unknown>(table: string, data: Record<string, unknown>): Promise<T | string>;
  
  from(table: string): {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => Promise<DatabaseResponse<unknown>>;
      match: (queryParams: Record<string, unknown>) => {
        maybeSingle: () => Promise<DatabaseResponse<unknown>>;
      };
      maybeSingle: () => Promise<DatabaseResponse<unknown>>;
    };
    insert: (data: unknown) => Promise<DatabaseResponse<unknown>>;
    update: (data: unknown, options?: { eq: [string, unknown][] }) => Promise<DatabaseResponse<unknown>>;
    delete: (options?: { eq: [string, unknown][] }) => Promise<DatabaseResponse<unknown>>;
  };
}

// Default implementation for backward compatibility
export const databaseService: DatabaseService = {
  query: async <T = unknown>(_query: string, _params?: unknown[]): Promise<{
    rows: T[];
    rowCount: number;
  }> => {
    console.warn('Database query not implemented:', _query, _params);
    return {
      rows: [],
      rowCount: 0
    };
  },
  
  getCategories: async (): Promise<{id: string; name: string; description?: string; created_at?: string; updated_at?: string}[]> => {
    console.warn('getCategories not implemented');
    return [];
  },
  
  getLessons: async (_limit?: number, _offset?: number, _filters?: Record<string, string | number | boolean>): Promise<Record<string, unknown>[]> => {
    console.warn('getLessons not implemented');
    return [];
  },
  
  create: async <T = unknown>(_table: string, _data: Record<string, unknown>): Promise<T | string> => {
    console.warn('create not implemented');
    return '' as string;
  },
  
  from: (_table: string) => ({
    select: (_columns?: string) => ({
      eq: async (_column: string, _value: unknown): Promise<DatabaseResponse<unknown>> => ({
        data: null,
        error: null
      }),
      match: (_queryParams: Record<string, unknown>) => ({
        maybeSingle: async (): Promise<DatabaseResponse<unknown>> => ({
          data: null,
          error: null
        })
      }),
      maybeSingle: async (): Promise<DatabaseResponse<unknown>> => ({
        data: null,
        error: null
      })
    }),
    insert: async (_data: unknown): Promise<DatabaseResponse<unknown>> => ({
      data: null,
      error: null
    }),
    update: async (_data: unknown, _options?: { eq: [string, unknown][] }): Promise<DatabaseResponse<unknown>> => ({
      data: null,
      error: null
    }),
    delete: async (_options?: { eq: [string, unknown][] }): Promise<DatabaseResponse<unknown>> => ({
      data: null,
      error: null
    })
  })
};
