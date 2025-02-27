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
      
      if (columnCheckResult.rows[0].exists) {
        // If username column exists, include it in the insert
        await client.query(`
          INSERT INTO profiles (user_id, display_name, username, avatar_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = $2, username = $3, avatar_url = $4, updated_at = $6
        `, [
          user.id, 
          displayName, 
          username, 
          `https://ui-avatars.com/api/?name=${displayName}&background=random`,
          user.created_at,
          user.updated_at
        ]);
      } else {
        // If username column doesn't exist, exclude it from the insert
        await client.query(`
          INSERT INTO profiles (user_id, display_name, avatar_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id) DO UPDATE
          SET display_name = $2, avatar_url = $3, updated_at = $5
        `, [
          user.id, 
          displayName, 
          `https://ui-avatars.com/api/?name=${displayName}&background=random`,
          user.created_at,
          user.updated_at
        ]);
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
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
