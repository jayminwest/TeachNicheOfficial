export interface DatabaseService {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  getCategories(): Promise<any[]>;
  getLessons(limit?: number, offset?: number, filters?: Record<string, any>): Promise<any[]>;
  // Add other database methods as needed
}
