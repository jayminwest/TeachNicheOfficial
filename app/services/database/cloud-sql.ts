import pkg from 'pg';
const { Pool } = pkg;
import type { PoolClient } from 'pg';
import { DatabaseService } from './interface';

export class CloudSqlDatabase implements DatabaseService {
  async create<T = unknown>(table: string, data: Record<string, unknown>): Promise<T | string> {
    const client = await this.getClient();
    try {
      // Convert data object to columns and values for SQL insert
      const columns = Object.keys(data);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const values = Object.values(data);
      
      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING id
      `;
      
      const result = await client.query(query, values);
      return result.rows[0]?.id || 'unknown-id';
    } catch (error) {
      console.error(`Error creating record in ${table}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  from(table: string) {
    return {
      select: (columns?: string) => ({
        eq: async (column: string, value: unknown): Promise<DatabaseResponse<unknown>> => {
          const client = await this.getClient();
          try {
            const columnSelection = columns || '*';
            const query = `SELECT ${columnSelection} FROM ${table} WHERE ${column} = $1`;
            const result = await client.query(query, [value]);
            
            return {
              data: result.rows,
              error: null
            };
          } catch (error) {
            console.error(`Error in from().select().eq():`, error);
            return {
              data: null,
              error: error instanceof Error ? error : new Error('Unknown error')
            };
          } finally {
            client.release();
          }
        },
        match: (queryParams: Record<string, unknown>) => ({
          maybeSingle: async (): Promise<DatabaseResponse<unknown>> => {
            const client = await this.getClient();
            try {
              const columnSelection = columns || '*';
              const conditions = Object.keys(queryParams).map((key, index) => `${key} = $${index + 1}`).join(' AND ');
              const values = Object.values(queryParams);
              
              const query = `SELECT ${columnSelection} FROM ${table} WHERE ${conditions} LIMIT 1`;
              const result = await client.query(query, values);
              
              return {
                data: result.rows[0] || null,
                error: null
              };
            } catch (error) {
              console.error(`Error in from().select().match().maybeSingle():`, error);
              return {
                data: null,
                error: error instanceof Error ? error : new Error('Unknown error')
              };
            } finally {
              client.release();
            }
          }
        }),
        maybeSingle: async (): Promise<DatabaseResponse<unknown>> => {
          const client = await this.getClient();
          try {
            const columnSelection = columns || '*';
            const query = `SELECT ${columnSelection} FROM ${table} LIMIT 1`;
            const result = await client.query(query);
            
            return {
              data: result.rows[0] || null,
              error: null
            };
          } catch (error) {
            console.error(`Error in from().select().maybeSingle():`, error);
            return {
              data: null,
              error: error instanceof Error ? error : new Error('Unknown error')
            };
          } finally {
            client.release();
          }
        }
      }),
      insert: async (data: unknown): Promise<DatabaseResponse<unknown>> => {
        const client = await this.getClient();
        try {
          const dataRecord = data as Record<string, unknown>;
          const columns = Object.keys(dataRecord);
          const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
          const values = Object.values(dataRecord);
          
          const query = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            RETURNING *
          `;
          
          const result = await client.query(query, values);
          
          return {
            data: result.rows[0] || null,
            error: null
          };
        } catch (error) {
          console.error(`Error in from().insert():`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        } finally {
          client.release();
        }
      },
      update: async (data: unknown, options?: { eq: [string, unknown][] }): Promise<DatabaseResponse<unknown>> => {
        const client = await this.getClient();
        try {
          if (!options?.eq || options.eq.length === 0) {
            throw new Error('Update requires eq options');
          }
          
          const dataRecord = data as Record<string, unknown>;
          const setClause = Object.keys(dataRecord)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');
          
          const values = Object.values(dataRecord);
          
          const whereConditions = options.eq.map(([field], index) => 
            `${field} = $${index + values.length + 1}`
          ).join(' AND ');
          
          const whereValues = options.eq.map(([, value]) => value);
          
          const query = `
            UPDATE ${table}
            SET ${setClause}
            WHERE ${whereConditions}
            RETURNING *
          `;
          
          const result = await client.query(query, [...values, ...whereValues]);
          
          return {
            data: result.rows[0] || null,
            error: null
          };
        } catch (error) {
          console.error(`Error in from().update():`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        } finally {
          client.release();
        }
      },
      delete: async (options?: { eq: [string, unknown][] }): Promise<DatabaseResponse<unknown>> => {
        const client = await this.getClient();
        try {
          if (!options?.eq || options.eq.length === 0) {
            throw new Error('Delete requires eq options');
          }
          
          const whereConditions = options.eq.map(([field], index) => 
            `${field} = $${index + 1}`
          ).join(' AND ');
          
          const values = options.eq.map(([, value]) => value);
          
          const query = `
            DELETE FROM ${table}
            WHERE ${whereConditions}
            RETURNING *
          `;
          
          const result = await client.query(query, values);
          
          return {
            data: { success: true, deleted: result.rowCount },
            error: null
          };
        } catch (error) {
          console.error(`Error in from().delete():`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        } finally {
          client.release();
        }
      }
    };
  }
  private pool: pkg.Pool;
  
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
        host: this.pool.options?.host,
        database: this.pool.options?.database,
        user: this.pool.options?.user,
        port: this.pool.options?.port,
        ssl: this.pool.options?.ssl,
      });
    }
  }
  
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }
  
  async query<T = unknown>(text: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return { 
        rows: result.rows as T[], 
        rowCount: result.rowCount || 0 
      };
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
  
  async getLessons(limit = 10, offset = 0, filters: Record<string, string | number | boolean> = {}): Promise<Record<string, unknown>[]> {
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
    
    const { rows } = await this.query<Record<string, unknown>>(query, params);
    return rows;
  }
}
