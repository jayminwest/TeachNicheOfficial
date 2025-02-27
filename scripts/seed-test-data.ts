#!/usr/bin/env node

/**
 * Script to seed test data into the Cloud SQL database
 * 
 * This script:
 * 1. Connects to the Cloud SQL database
 * 2. Clears existing test data (optional)
 * 3. Seeds test users, profiles, lessons, and other required data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

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

// Test data
const testUsers = [
  {
    id: uuidv4(),
    email: 'test@example.com',
    password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    email: 'creator@example.com',
    password_hash: crypto.createHash('sha256').update('password123').digest('hex'),
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function seedTestData() {
  console.log('Starting test data seeding...');
  console.log(`Connecting to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
  
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if auth schema exists
    const schemaCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = 'auth'
      );
    `);
    
    if (!schemaCheckResult.rows[0].exists) {
      console.log('Auth schema does not exist. Creating it...');
      await client.query(`CREATE SCHEMA IF NOT EXISTS auth;`);
      
      // Create users table in auth schema
      await client.query(`
        CREATE TABLE IF NOT EXISTS auth.users (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          encrypted_password TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          raw_app_meta_data JSONB,
          raw_user_meta_data JSONB
        );
      `);
      console.log('Created auth schema and users table');
    }
    
    // Insert test users
    console.log('Inserting test users...');
    for (const user of testUsers) {
      await client.query(`
        INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.email, user.password_hash, user.created_at, user.updated_at]);
    }
    
    // Check if profiles table exists
    const profilesTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `);
    
    if (!profilesTableExists.rows[0].exists) {
      console.log('Creating profiles table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          display_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
    
    // Insert profiles for test users
    console.log('Inserting user profiles...');
    for (const user of testUsers) {
      const username = user.email.split('@')[0];
      const displayName = username.charAt(0).toUpperCase() + username.slice(1);
      
      // Check if the profiles table has a username column
      const columnCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'username'
        );
      `);
      
      // Check if the profiles table has a user_id column
      const userIdColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'user_id'
        );
      `);
      
      if (!userIdColumnResult.rows[0].exists) {
        console.log('Adding user_id column to profiles table...');
        await client.query(`
          ALTER TABLE profiles 
          ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        `);
      }
      
      // Check if user_id has a unique constraint
      const uniqueConstraintExists = await client.query(`
        SELECT COUNT(*) > 0 AS exists
        FROM pg_constraint
        WHERE conrelid = 'profiles'::regclass
        AND contype = 'u'
        AND conkey @> ARRAY[
          (SELECT attnum FROM pg_attribute 
           WHERE attrelid = 'profiles'::regclass 
           AND attname = 'user_id')
        ]::smallint[];
      `);
      
      if (!uniqueConstraintExists.rows[0].exists) {
        console.log('Adding unique constraint to user_id column...');
        await client.query(`
          ALTER TABLE profiles 
          ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
        `);
      }
      
      // Check if the profiles table has a display_name column
      const displayNameColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'display_name'
        );
      `);
      
      if (!displayNameColumnResult.rows[0].exists) {
        console.log('Adding display_name column to profiles table...');
        await client.query(`
          ALTER TABLE profiles 
          ADD COLUMN display_name TEXT;
        `);
      }
      
      // Check if the profiles table has an avatar_url column
      const avatarUrlColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'avatar_url'
        );
      `);
      
      if (!avatarUrlColumnResult.rows[0].exists) {
        console.log('Adding avatar_url column to profiles table...');
        await client.query(`
          ALTER TABLE profiles 
          ADD COLUMN avatar_url TEXT;
        `);
      }
      
      // Check if the profiles table has a full_name column
      const fullNameColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'full_name'
        );
      `);
      
      if (fullNameColumnResult.rows[0].exists) {
        console.log('Found full_name column in profiles table...');
        
        // Check if full_name column has a NOT NULL constraint
        const fullNameNotNullResult = await client.query(`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'full_name'
        `);
        
        const isNullable = fullNameNotNullResult.rows[0]?.is_nullable === 'YES';
        
        if (!isNullable) {
          console.log('full_name column has NOT NULL constraint, adding default value...');
          // Try to make the column nullable first
          try {
            await client.query(`
              ALTER TABLE profiles 
              ALTER COLUMN full_name DROP NOT NULL;
            `);
            console.log('Made full_name column nullable');
          } catch (error) {
            console.log('Could not make full_name column nullable, will provide a value');
          }
        }
      }
      
      // Check if the profiles table has an email column
      const emailColumnResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'email'
        );
      `);
      
      if (emailColumnResult.rows[0].exists) {
        console.log('Found email column in profiles table...');
        
        // Check if email column has a NOT NULL constraint
        const emailNotNullResult = await client.query(`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'email'
        `);
        
        const isNullable = emailNotNullResult.rows[0]?.is_nullable === 'YES';
        
        if (!isNullable) {
          console.log('email column has NOT NULL constraint, adding default value...');
          // Try to make the column nullable first
          try {
            await client.query(`
              ALTER TABLE profiles 
              ALTER COLUMN email DROP NOT NULL;
            `);
            console.log('Made email column nullable');
          } catch (error) {
            console.log('Could not make email column nullable, will provide a value');
          }
        }
      }
      
      try {
        const profileId = uuidv4();
        const fullNameColumnExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'full_name'
          );
        `);
        
        // Prepare query and parameters based on column existence
        let query, params;
        
        // Check if email column exists
        const emailColumnExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'email'
          );
        `);
        
        // Prepare query and parameters based on column existence
        let query, params;
        
        if (columnCheckResult.rows[0].exists && fullNameColumnExists.rows[0].exists && emailColumnExists.rows[0].exists) {
          // Username, full_name, and email columns exist
          console.log('Inserting profile with username, full_name, and email...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, username, full_name, email, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, username = $4, full_name = $5, email = $6, avatar_url = $7, updated_at = $9
          `;
          params = [
            profileId,
            user.id, 
            displayName, 
            username,
            displayName, // Use displayName for full_name too
            user.email,  // Use user's email
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        } else if (fullNameColumnExists.rows[0].exists && emailColumnExists.rows[0].exists) {
          // full_name and email columns exist (no username)
          console.log('Inserting profile with full_name and email but no username...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, full_name, email, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, full_name = $4, email = $5, avatar_url = $6, updated_at = $8
          `;
          params = [
            profileId,
            user.id, 
            displayName,
            displayName, // Use displayName for full_name too
            user.email,  // Use user's email
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        } else if (columnCheckResult.rows[0].exists && emailColumnExists.rows[0].exists) {
          // username and email columns exist (no full_name)
          console.log('Inserting profile with username and email but no full_name...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, username, email, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, username = $4, email = $5, avatar_url = $6, updated_at = $8
          `;
          params = [
            profileId,
            user.id, 
            displayName, 
            username,
            user.email,  // Use user's email
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        } else if (emailColumnExists.rows[0].exists) {
          // Only email column exists (no username or full_name)
          console.log('Inserting profile with email only...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, email, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, email = $4, avatar_url = $5, updated_at = $7
          `;
          params = [
            profileId,
            user.id, 
            displayName,
            user.email,  // Use user's email
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        } else if (columnCheckResult.rows[0].exists && fullNameColumnExists.rows[0].exists) {
          // Both username and full_name columns exist (no email)
          console.log('Inserting profile with username and full_name...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, username, full_name, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, username = $4, full_name = $5, avatar_url = $6, updated_at = $8
          `;
          params = [
            profileId,
            user.id, 
            displayName, 
            username,
            displayName, // Use displayName for full_name too
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        } else if (fullNameColumnExists.rows[0].exists) {
          // Only full_name column exists (no username or email)
          console.log('Inserting profile with full_name but no username...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, full_name, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, full_name = $4, avatar_url = $5, updated_at = $7
          `;
          params = [
            profileId,
            user.id, 
            displayName,
            displayName, // Use displayName for full_name too
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        } else if (columnCheckResult.rows[0].exists) {
          // Only username column exists (no full_name or email)
          console.log('Inserting profile with username but no full_name...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, username, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, username = $4, avatar_url = $5, updated_at = $7
          `;
          params = [
            profileId,
            user.id, 
            displayName, 
            username, 
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        } else {
          // No special columns exist
          console.log('Inserting profile with basic columns only...');
          query = `
            INSERT INTO profiles (id, user_id, display_name, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id) DO UPDATE
            SET display_name = $3, avatar_url = $4, updated_at = $6
          `;
          params = [
            profileId,
            user.id, 
            displayName, 
            `https://ui-avatars.com/api/?name=${displayName}&background=random`,
            user.created_at,
            user.updated_at
          ];
        }
        
        // Execute the query with appropriate parameters
        await client.query(query, params);
      } catch (error) {
        console.error('Error inserting profile for user:', user.email);
        console.error('Error details:', error);
        // Continue with the next user instead of failing the entire script
        continue;
      }
    }
    
    // Insert test categories
    console.log('Inserting test categories...');
    const categories = ['Kendama', 'Juggling', 'Yo-yo', 'Skill Toys'];
    for (const category of categories) {
      await client.query(`
        INSERT INTO categories (id, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `, [uuidv4(), category, new Date(), new Date()]);
    }
    
    // Insert test lessons
    console.log('Inserting test lessons...');
    const creatorId = testUsers[1].id;
    const lessonId = uuidv4();
    
    await client.query(`
      INSERT INTO lessons (
        id, creator_id, title, description, price, 
        mux_asset_id, mux_playback_id, thumbnail_url, 
        created_at, updated_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING
    `, [
      lessonId,
      creatorId,
      'Introduction to Kendama',
      'Learn the basics of kendama play with this comprehensive introduction.',
      1999, // $19.99
      'mux_asset_123',
      'mux_playback_123',
      'https://images.unsplash.com/photo-1559116315-f158f9ee34b3',
      new Date(),
      new Date(),
      'published'
    ]);
    
    // Insert test purchases
    console.log('Inserting test purchases...');
    await client.query(`
      INSERT INTO purchases (
        id, user_id, lesson_id, amount, status,
        created_at, updated_at, stripe_session_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      uuidv4(),
      testUsers[0].id,
      lessonId,
      1999, // $19.99
      'completed',
      new Date(),
      new Date(),
      'stripe_session_123'
    ]);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Test data seeded successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding test data:', error);
    // Don't throw the error, just log it and exit gracefully
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
