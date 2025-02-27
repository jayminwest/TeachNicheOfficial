/**
 * Database Migration Script
 * 
 * This script migrates data from Supabase to Google Cloud SQL.
 * It creates the schema and transfers data for all tables.
 * 
 * Usage:
 * 1. Set up environment variables for both Supabase and GCP
 * 2. Run with: npx ts-node scripts/migrate-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

// Cloud SQL connection
const cloudSqlPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'teach-niche-db',
  ssl: process.env.DB_SSL === 'true' ? true : false
});

// Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to migrate in order (respecting foreign key constraints)
const tables = [
  'categories',
  'profiles',
  'lessons',
  'lesson_category',
  'purchases',
  'reviews',
  'creator_applications',
  'creator_earnings',
  'creator_payout_methods',
  'creator_payouts',
  'lesson_requests',
  'lesson_request_votes',
  'waitlist'
];

// Custom types that need to be created
const customTypes = [
  {
    name: 'lesson_status',
    values: ['draft', 'published', 'archived']
  },
  {
    name: 'purchase_status',
    values: ['pending', 'completed', 'failed', 'refunded']
  }
];

// Main migration function
async function migrateDatabase() {
  console.log('Starting database migration...');
  
  try {
    // Create schema
    await createSchema();
    
    // Migrate data for each table
    for (const table of tables) {
      await migrateTable(table);
    }
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await cloudSqlPool.end();
  }
}

// Create database schema
async function createSchema() {
  console.log('Creating database schema...');
  
  try {
    // Create custom types
    for (const type of customTypes) {
      await createCustomType(type.name, type.values);
    }
    
    // Create tables
    await createCategoriesTable();
    await createProfilesTable();
    await createLessonsTable();
    await createLessonCategoryTable();
    await createPurchasesTable();
    await createReviewsTable();
    await createCreatorApplicationsTable();
    await createCreatorEarningsTable();
    await createCreatorPayoutMethodsTable();
    await createCreatorPayoutsTable();
    await createLessonRequestsTable();
    await createLessonRequestVotesTable();
    await createWaitlistTable();
    
    console.log('Schema created successfully');
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

// Create a custom enum type
async function createCustomType(name: string, values: string[]) {
  const valuesString = values.map(v => `'${v}'`).join(', ');
  const query = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN
        CREATE TYPE ${name} AS ENUM (${valuesString});
      END IF;
    END
    $$;
  `;
  
  await cloudSqlPool.query(query);
  console.log(`Created custom type: ${name}`);
}

// Create categories table
async function createCategoriesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created categories table');
}

// Create profiles table
async function createProfilesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      social_media_tag TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      stripe_account_id TEXT,
      deleted_at TIMESTAMPTZ
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created profiles table');
}

// Create lessons table
async function createLessonsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price NUMERIC NOT NULL,
      creator_id UUID NOT NULL REFERENCES profiles(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      stripe_product_id TEXT,
      stripe_price_id TEXT,
      content TEXT,
      content_url TEXT,
      thumbnail_url TEXT,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      status lesson_status NOT NULL DEFAULT 'draft',
      deleted_at TIMESTAMPTZ,
      version INTEGER NOT NULL DEFAULT 1,
      mux_asset_id TEXT,
      mux_playback_id TEXT
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created lessons table');
}

// Create lesson_category table
async function createLessonCategoryTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS lesson_category (
      lesson_id UUID NOT NULL REFERENCES lessons(id),
      category_id UUID NOT NULL REFERENCES categories(id),
      PRIMARY KEY (lesson_id, category_id)
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created lesson_category table');
}

// Create purchases table
async function createPurchasesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS purchases (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id),
      lesson_id UUID NOT NULL REFERENCES lessons(id),
      creator_id UUID NOT NULL REFERENCES profiles(id),
      purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
      stripe_session_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      platform_fee NUMERIC NOT NULL,
      creator_earnings NUMERIC NOT NULL,
      payment_intent_id TEXT NOT NULL,
      fee_percentage NUMERIC NOT NULL,
      status purchase_status NOT NULL DEFAULT 'pending',
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      version INTEGER NOT NULL DEFAULT 1
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created purchases table');
}

// Create reviews table
async function createReviewsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id),
      lesson_id UUID NOT NULL REFERENCES lessons(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created reviews table');
}

// Create creator_applications table
async function createCreatorApplicationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS creator_applications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id),
      motivation TEXT NOT NULL,
      sample_lesson_title VARCHAR NOT NULL,
      sample_lesson_content TEXT NOT NULL,
      teaching_approach TEXT NOT NULL,
      instagram_handle VARCHAR,
      status VARCHAR NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by UUID REFERENCES profiles(id)
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created creator_applications table');
}

// Create creator_earnings table
async function createCreatorEarningsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS creator_earnings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      creator_id UUID NOT NULL REFERENCES profiles(id),
      payment_intent_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      lesson_id UUID NOT NULL REFERENCES lessons(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      payout_id UUID REFERENCES creator_payouts(id)
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created creator_earnings table');
}

// Create creator_payout_methods table
async function createCreatorPayoutMethodsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS creator_payout_methods (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      creator_id UUID NOT NULL REFERENCES profiles(id),
      bank_account_token TEXT NOT NULL,
      last_four TEXT NOT NULL,
      bank_name TEXT,
      account_holder_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      is_default BOOLEAN NOT NULL DEFAULT true
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created creator_payout_methods table');
}

// Create creator_payouts table
async function createCreatorPayoutsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS creator_payouts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      creator_id UUID NOT NULL REFERENCES profiles(id),
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payout_id TEXT NOT NULL,
      destination_last_four TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created creator_payouts table');
}

// Create lesson_requests table
async function createLessonRequestsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS lesson_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      user_id UUID REFERENCES profiles(id),
      status TEXT DEFAULT 'open',
      vote_count INTEGER DEFAULT 0,
      category TEXT,
      tags TEXT[],
      instagram_handle TEXT
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created lesson_requests table');
}

// Create lesson_request_votes table
async function createLessonRequestVotesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS lesson_request_votes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      request_id UUID REFERENCES lesson_requests(id),
      user_id UUID REFERENCES profiles(id),
      vote_type TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created lesson_request_votes table');
}

// Create waitlist table
async function createWaitlistTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      signed_up_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
    );
  `;
  
  await cloudSqlPool.query(query);
  console.log('Created waitlist table');
}

// Migrate data for a specific table
async function migrateTable(tableName: string) {
  console.log(`Migrating data for table: ${tableName}`);
  
  try {
    // Get data from Supabase
    const { data, error } = await supabase.from(tableName).select('*');
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log(`No data found for table: ${tableName}`);
      return;
    }
    
    console.log(`Found ${data.length} rows to migrate for table: ${tableName}`);
    
    // Insert data into Cloud SQL in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await insertBatch(tableName, batch);
      console.log(`Migrated batch ${i / batchSize + 1} for table: ${tableName}`);
    }
    
    console.log(`Successfully migrated data for table: ${tableName}`);
  } catch (error) {
    console.error(`Error migrating data for table: ${tableName}:`, error);
    throw error;
  }
}

// Insert a batch of records
async function insertBatch(tableName: string, records: any[]) {
  if (records.length === 0) return;
  
  // Get column names from the first record
  const columns = Object.keys(records[0]);
  
  // Create a prepared statement
  const placeholders = records.map((_, recordIndex) => 
    `(${columns.map((_, colIndex) => `$${recordIndex * columns.length + colIndex + 1}`).join(', ')})`
  ).join(', ');
  
  const query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES ${placeholders}
    ON CONFLICT DO NOTHING;
  `;
  
  // Flatten all values into a single array
  const values = records.flatMap(record => columns.map(col => record[col]));
  
  // Execute the query
  await cloudSqlPool.query(query, values);
}

// Run the migration
migrateDatabase().catch(console.error);
