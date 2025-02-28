export interface DatabaseService {
  query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  getCategories(): Promise<{id: string; name: string; description?: string; created_at?: string; updated_at?: string}[]>;
  getLessons(
    limit?: number, 
    offset?: number, 
    filters?: Record<string, string | number | boolean>
  ): Promise<Record<string, unknown>[]>;
  // Add other database methods as needed
}
