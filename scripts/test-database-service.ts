import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create a factory function to get the appropriate database service
function getDatabaseService() {
  const useGcp = process.env.USE_GCP_SERVICES === 'true';
  
  if (useGcp) {
    // Use Cloud SQL
    return new CloudSqlDatabase();
  } else {
    // Use Supabase
    return new SupabaseDatabase();
  }
}

// Cloud SQL Database implementation
class CloudSqlDatabase {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.DB_SSL === 'true' ? true : false,
    });
  }
  
  async getCategories() {
    const { rows } = await this.pool.query('SELECT * FROM categories ORDER BY name');
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
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const { rows } = await this.pool.query(query, params);
    return rows;
  }
  
  async close() {
    await this.pool.end();
  }
}

// Supabase Database implementation
class SupabaseDatabase {
  private supabase;
  
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  async getCategories() {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data;
  }
  
  async getLessons(limit = 10, offset = 0, filters: Record<string, any> = {}) {
    let query = this.supabase
      .from('lessons')
      .select('*');
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query
      .limit(limit)
      .offset(offset);
      
    if (error) throw error;
    return data;
  }
  
  async close() {
    // No explicit close needed for Supabase
  }
}

async function testDatabaseService() {
  console.log('Testing database service...');
  console.log(`Using ${process.env.USE_GCP_SERVICES === 'true' ? 'GCP Cloud SQL' : 'Supabase'}`);
  
  const db = getDatabaseService();
  
  try {
    // Test getting categories
    console.log('Testing getCategories()...');
    const categories = await db.getCategories();
    console.log(`Successfully retrieved ${categories.length} categories`);
    
    // Test getting lessons
    console.log('Testing getLessons()...');
    const lessons = await db.getLessons(10, 0, { status: 'published' });
    console.log(`Successfully retrieved ${lessons.length} lessons`);
    
    console.log('Database service tests completed successfully');
  } catch (error) {
    console.error('Database service test failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
  
  process.exit(0);
}

testDatabaseService().catch(err => {
  console.error('Database service test failed:', err);
  process.exit(1);
});
