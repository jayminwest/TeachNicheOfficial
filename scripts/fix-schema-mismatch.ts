#!/usr/bin/env node

/**
 * Script to fix database schema mismatches between Supabase and Cloud SQL
 * 
 * This script:
 * 1. Connects to the Cloud SQL database
 * 2. Checks for schema mismatches (like missing columns)
 * 3. Applies fixes to align the schema with application expectations
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const dotenvPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(dotenvPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: dotenvPath });
}

// Database connection configuration
const dbConfig = {
  host: process.env.CLOUD_SQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.CLOUD_SQL_USER || process.env.DB_USER || 'postgres',
  password: process.env.CLOUD_SQL_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.CLOUD_SQL_DATABASE || process.env.DB_NAME || 'teach-niche-db',
  port: parseInt(process.env.CLOUD_SQL_PORT || process.env.DB_PORT || '5432'),
};

// Create a connection pool
const pool = new Pool(dbConfig);

async function main() {
  console.log('Starting schema mismatch fix script...');
  console.log(`Connecting to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
  
  try {
    // Check connection
    const client = await pool.connect();
    console.log('Successfully connected to database');
    
    // Check if profiles table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.error('Error: profiles table does not exist');
      client.release();
      await pool.end();
      process.exit(1);
    }
    
    // Check if username column exists in profiles table
    const columnCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
      );
    `);
    
    if (!columnCheckResult.rows[0].exists) {
      console.log('Username column does not exist in profiles table. Adding it...');
      
      // Add username column to profiles table
      await client.query(`
        ALTER TABLE profiles 
        ADD COLUMN username TEXT UNIQUE;
      `);
      
      console.log('Successfully added username column to profiles table');
      
      // Update username values based on user_id or email
      await client.query(`
        UPDATE profiles 
        SET username = CONCAT('user_', user_id) 
        WHERE username IS NULL;
      `);
      
      console.log('Successfully populated username column with default values');
    } else {
      console.log('Username column already exists in profiles table');
    }
    
    // Check for other common schema mismatches and fix them
    // Add more checks and fixes as needed
    
    console.log('Schema mismatch check and fix completed successfully');
    client.release();
  } catch (error) {
    console.error('Error fixing schema mismatches:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
