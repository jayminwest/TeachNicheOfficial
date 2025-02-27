#!/bin/bash

# Fix duplicate imports in test scripts
echo "Fixing test scripts..."

# Fix test-firebase-storage.ts
echo "Fixing test-firebase-storage.ts..."
sed -i '' 's/import { initializeApp } from '\''firebase\/app'\'';/\/\/ Firebase app should be initialized only once/' scripts/test-firebase-storage.ts

# Fix test-email-service.ts
echo "Fixing test-email-service.ts..."
sed -i '' 's/import dotenv from '\''dotenv'\'';/\/\/ Import dotenv only once/' scripts/test-email-service.ts

# Add proper error handling to verify-migration.ts
echo "Updating verify-migration.ts with better error handling..."
cat > scripts/verify-migration-temp.ts << 'EOF'
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Cloud SQL connection
const cloudSqlConfig = {
  user: process.env.CLOUD_SQL_USER || 'postgres',
  password: process.env.CLOUD_SQL_PASSWORD,
  database: process.env.CLOUD_SQL_DATABASE || 'postgres',
  host: process.env.CLOUD_SQL_HOST || 'localhost',
  port: parseInt(process.env.CLOUD_SQL_PORT || '5432'),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

console.log('Cloud SQL connection config:', {
  ...cloudSqlConfig,
  password: cloudSqlConfig.password ? '***' : undefined,
});

const cloudSqlPool = new pg.Pool(cloudSqlConfig);

// Tables to verify
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
  'waitlist',
];

async function getSupabaseCount(table: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error getting count from Supabase for ${table}:`, error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`Error getting count from Supabase for ${table}:`, error);
    return 0;
  }
}

async function getCloudSqlCount(table: string): Promise<number> {
  try {
    const client = await cloudSqlPool.connect();
    try {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error getting count from Cloud SQL for ${table}:`, error);
    if (error.code === 'ECONNREFUSED') {
      console.error(`Could not connect to Cloud SQL at ${cloudSqlConfig.host}:${cloudSqlConfig.port}`);
      console.error('Please make sure the Cloud SQL instance is created and accessible.');
      console.error('You can create it using Terraform:');
      console.error('  cd terraform/environments/dev');
      console.error('  terraform apply');
    }
    return -1;
  }
}

async function verifyTable(table: string): Promise<boolean> {
  console.log(`Verifying table: ${table}`);
  
  const supabaseCount = await getSupabaseCount(table);
  const cloudSqlCount = await getCloudSqlCount(table);
  
  if (cloudSqlCount === -1) {
    console.error(`Verification failed for table ${table}`);
    return false;
  }
  
  console.log(`  Supabase count: ${supabaseCount}`);
  console.log(`  Cloud SQL count: ${cloudSqlCount}`);
  
  if (supabaseCount === cloudSqlCount) {
    console.log(`  ✅ Counts match for ${table}`);
    return true;
  } else {
    console.log(`  ❌ Counts do not match for ${table}`);
    return false;
  }
}

async function verifyMigration() {
  console.log('Starting migration verification...');
  
  try {
    // Test connection to Cloud SQL
    const client = await cloudSqlPool.connect();
    console.log('Successfully connected to Cloud SQL');
    client.release();
  } catch (error) {
    console.error('Failed to connect to Cloud SQL:', error);
    console.error('Please make sure the Cloud SQL instance is created and accessible.');
    console.error('You can create it using Terraform:');
    console.error('  cd terraform/environments/dev');
    console.error('  terraform apply');
    process.exit(1);
  }
  
  let allTablesVerified = true;
  
  for (const table of tables) {
    const isVerified = await verifyTable(table);
    if (!isVerified) {
      allTablesVerified = false;
    }
  }
  
  if (allTablesVerified) {
    console.log('✅ All tables verified successfully!');
  } else {
    console.log('❌ Verification failed for one or more tables');
  }
  
  // Close connections
  await cloudSqlPool.end();
}

verifyMigration().catch(error => {
  console.error('Migration verification failed:', error);
  process.exit(1);
});
EOF

mv scripts/verify-migration-temp.ts scripts/verify-migration.ts
chmod +x scripts/fix-test-scripts.sh

echo "Test scripts fixed successfully!"
