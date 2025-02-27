#!/usr/bin/env node

/**
 * Script to create auth schema for user tables in the Cloud SQL database
 * 
 * This script:
 * 1. Connects to the Cloud SQL database
 * 2. Creates the auth schema if it doesn't exist
 * 3. Creates necessary auth tables for user management
 */

import fs from 'fs';
import path from 'path';
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

// Import pg dynamically to avoid ESM issues
const pg = await import('pg');
const { Pool } = pg.default;

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
  console.log('Starting auth schema creation script...');
  console.log(`Connecting to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
  
  try {
    // Check connection
    const client = await pool.connect();
    console.log('Successfully connected to database');
    
    // Check if auth schema exists
    const schemaCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = 'auth'
      );
    `);
    
    if (!schemaCheckResult.rows[0].exists) {
      console.log('Auth schema does not exist. Creating it...');
      
      // Create auth schema
      await client.query(`CREATE SCHEMA IF NOT EXISTS auth;`);
      console.log('Successfully created auth schema');
    } else {
      console.log('Auth schema already exists');
    }
    
    // Check if users table exists in auth schema
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.log('Users table does not exist in auth schema. Creating it...');
      
      // Create users table in auth schema
      await client.query(`
        CREATE TABLE auth.users (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          encrypted_password TEXT,
          email_confirmed_at TIMESTAMP WITH TIME ZONE,
          last_sign_in_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          raw_app_meta_data JSONB,
          raw_user_meta_data JSONB,
          is_super_admin BOOLEAN,
          phone TEXT,
          phone_confirmed_at TIMESTAMP WITH TIME ZONE,
          confirmation_token TEXT,
          recovery_token TEXT,
          email_change_token TEXT,
          email_change TEXT,
          banned_until TIMESTAMP WITH TIME ZONE,
          reauthentication_token TEXT,
          reauthentication_sent_at TIMESTAMP WITH TIME ZONE
        );
      `);
      
      console.log('Successfully created users table in auth schema');
    } else {
      console.log('Users table already exists in auth schema');
    }
    
    // Check if identities table exists in auth schema
    const identitiesTableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'identities'
      );
    `);
    
    if (!identitiesTableCheckResult.rows[0].exists) {
      console.log('Identities table does not exist in auth schema. Creating it...');
      
      // Create identities table in auth schema
      await client.query(`
        CREATE TABLE auth.identities (
          id TEXT NOT NULL,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          identity_data JSONB NOT NULL,
          provider TEXT NOT NULL,
          last_sign_in_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          PRIMARY KEY (id, provider)
        );
      `);
      
      console.log('Successfully created identities table in auth schema');
    } else {
      console.log('Identities table already exists in auth schema');
    }
    
    // Check if sessions table exists in auth schema
    const sessionsTableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'sessions'
      );
    `);
    
    if (!sessionsTableCheckResult.rows[0].exists) {
      console.log('Sessions table does not exist in auth schema. Creating it...');
      
      // Create sessions table in auth schema
      await client.query(`
        CREATE TABLE auth.sessions (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          factor_id UUID,
          not_after TIMESTAMP WITH TIME ZONE
        );
      `);
      
      console.log('Successfully created sessions table in auth schema');
    } else {
      console.log('Sessions table already exists in auth schema');
    }
    
    // Check if refresh_tokens table exists in auth schema
    const refreshTokensTableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'refresh_tokens'
      );
    `);
    
    if (!refreshTokensTableCheckResult.rows[0].exists) {
      console.log('Refresh tokens table does not exist in auth schema. Creating it...');
      
      // Create refresh_tokens table in auth schema
      await client.query(`
        CREATE TABLE auth.refresh_tokens (
          id BIGSERIAL PRIMARY KEY,
          token TEXT NOT NULL UNIQUE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          revoked BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          parent TEXT,
          session_id UUID REFERENCES auth.sessions(id) ON DELETE CASCADE
        );
      `);
      
      console.log('Successfully created refresh_tokens table in auth schema');
    } else {
      console.log('Refresh tokens table already exists in auth schema');
    }
    
    // Update profiles table to reference auth.users if needed
    const profilesTableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `);
    
    if (profilesTableCheckResult.rows[0].exists) {
      console.log('Checking profiles table foreign key constraint...');
      
      // Check if user_id column exists in profiles table
      const userIdColumnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'user_id'
        );
      `);
      
      if (userIdColumnCheckResult.rows[0].exists) {
        // Check if foreign key constraint exists
        const fkCheckResult = await client.query(`
          SELECT COUNT(*) FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND tc.table_name = 'profiles'
          AND ccu.column_name = 'user_id'
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users';
        `);
        
        if (parseInt(fkCheckResult.rows[0].count) === 0) {
          console.log('Foreign key constraint does not exist. Adding it...');
          
          try {
            // First, check if there's an existing constraint to drop
            const existingFkResult = await client.query(`
              SELECT tc.constraint_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_name = ccu.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_schema = 'public'
              AND tc.table_name = 'profiles'
              AND ccu.column_name = 'user_id';
            `);
            
            if (existingFkResult.rows.length > 0) {
              // Drop existing foreign key constraint
              const constraintName = existingFkResult.rows[0].constraint_name;
              await client.query(`
                ALTER TABLE profiles DROP CONSTRAINT "${constraintName}";
              `);
              console.log(`Dropped existing foreign key constraint: ${constraintName}`);
            }
            
            // Add foreign key constraint to auth.users
            await client.query(`
              ALTER TABLE profiles
              ADD CONSTRAINT profiles_user_id_fkey
              FOREIGN KEY (user_id)
              REFERENCES auth.users(id)
              ON DELETE CASCADE;
            `);
            
            console.log('Successfully added foreign key constraint to profiles table');
          } catch (error) {
            console.warn('Could not add foreign key constraint:', error.message);
            console.log('This is not critical - the application can still function without it.');
          }
        } else {
          console.log('Foreign key constraint already exists');
        }
      } else {
        console.warn('user_id column does not exist in profiles table');
      }
    } else {
      console.warn('Profiles table does not exist');
    }
    
    console.log('Auth schema setup completed successfully');
    client.release();
  } catch (error) {
    console.error('Error setting up auth schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
