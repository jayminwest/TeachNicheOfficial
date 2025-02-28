import pkg from 'pg';
const { Pool } = pkg;
import type { PoolClient } from 'pg';
import { DatabaseService } from './interface';

export class CloudSqlDatabase implements DatabaseService {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      host: process.env.CLOUD_SQL_HOST || process.env.DB_HOST,
      user: process.env.CLOUD_SQL_USER || process.env.DB_USER,
      password: process.env.CLOUD_SQL_PASSWORD || process.env.DB_PASSWORD,
      database: process.env.CLOUD_SQL_DATABASE || process.env.DB_NAME,
      port: parseInt(process.env.CLOUD_SQL_PORT || process.env.DB_PORT || '5432'),
      ssl: process.env.NODE_ENV === 'production',
      max: 20, // Maximum number of clients in the pool
    });
    
    // Log connection info in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Database connection configured with:', {
        host: this.pool.options.host,
        database: this.pool.options.database,
        user: this.pool.options.user,
        port: this.pool.options.port,
        ssl: this.pool.options.ssl,
      });
    }
  }
  
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }
  
  async query<T>(text: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } finally {
      client.release();
    }
  }
  
  async getCategories(): Promise<{
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }[]> {
    const { rows } = await this.query<{
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM categories ORDER BY name');
    
    return rows;
  }
  
  async getLessons(limit = 10, offset = 0, filters: Record<string, string | number | boolean> = {}): Promise<any[]> {
    let query = 'SELECT * FROM lessons WHERE 1=1';
    const params: (string | number | boolean)[] = [];
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
