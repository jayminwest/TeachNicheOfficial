import { Pool, PoolClient } from 'pg';
import { DatabaseService } from './interface';

export class CloudSqlDatabase implements DatabaseService {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.NODE_ENV === 'production',
      max: 20, // Maximum number of clients in the pool
    });
  }
  
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }
  
  async query<T>(text: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } finally {
      client.release();
    }
  }
  
  async getCategories() {
    const { rows } = await this.query<{
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM categories ORDER BY name');
    
    return rows;
  }
  
  async getLessons(limit = 10, offset = 0, filters: Record<string, any> = {}) {
    let query = 'SELECT * FROM lessons WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query += ` AND ${key} = $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    });
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const { rows } = await this.query(query, params);
    return rows;
  }
}
