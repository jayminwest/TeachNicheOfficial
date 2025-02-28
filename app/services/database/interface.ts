export interface DatabaseService {
  query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  getCategories(): Promise<{id: string; name: string; description: string}[]>;
  getLessons(
    limit?: number, 
    offset?: number, 
    filters?: Record<string, string | number | boolean>
  ): Promise<{id: string; title: string; content: string; category_id: string}[]>;
  // Add other database methods as needed
}
