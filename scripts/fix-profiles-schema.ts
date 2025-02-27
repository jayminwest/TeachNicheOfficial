import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Extract Pool from pg package (CommonJS module)
const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'teach_niche_db',
  user: process.env.DB_USER || process.env.USER || 'postgres', // Use system user as fallback
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
};

console.log(`Using database user: ${dbConfig.user}`);

// Create a connection pool
const pool = new Pool(dbConfig);

async function fixProfilesSchema() {
  console.log('Starting profiles table schema fix...');
  console.log(`Connecting to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
  
  const client = await pool.connect();
  
  try {
    console.log('Successfully connected to database');
    
    // Check if user_id column exists in profiles table
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'user_id';
    `;
    
    const { rows } = await client.query(checkColumnQuery);
    
    if (rows.length === 0) {
      console.log('user_id column does not exist in profiles table. Adding it...');
      
      // Begin transaction
      await client.query('BEGIN');
      
      try {
        // Add user_id column to profiles table
        await client.query(`
          ALTER TABLE profiles 
          ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        `);
        
        // Update existing profiles to link with auth.users if possible
        // This is a placeholder - in a real migration you'd need to match profiles to users
        console.log('Updating existing profiles with user_id values...');
        await client.query(`
          UPDATE profiles p
          SET user_id = u.id
          FROM auth.users u
          WHERE p.id = u.id;
        `);
        
        // Add NOT NULL constraint if needed
        console.log('Adding NOT NULL constraint to user_id column...');
        await client.query(`
          ALTER TABLE profiles 
          ALTER COLUMN user_id SET NOT NULL;
        `);
        
        // Add index for performance
        console.log('Creating index on user_id column...');
        await client.query(`
          CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
        `);
        
        // Commit transaction
        await client.query('COMMIT');
        console.log('Successfully added and populated user_id column in profiles table');
      } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Error fixing profiles schema:', error);
        throw error;
      }
    } else {
      console.log('user_id column already exists in profiles table');
    }
    
    console.log('Profiles table schema fix completed successfully');
  } catch (error) {
    console.error('Error fixing profiles schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
fixProfilesSchema()
  .then(() => {
    console.log('Schema fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema fix failed:', error);
    process.exit(1);
  });
