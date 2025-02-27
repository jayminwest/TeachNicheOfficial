import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cloud SQL connection
const cloudSqlPool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? true : false,
});

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
  'waitlist'
];

async function verifyTable(tableName: string) {
  console.log(`Verifying table: ${tableName}`);
  
  // Get count from Supabase
  const { count: supabaseCount, error: supabaseError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  if (supabaseError) {
    console.error(`Error getting count from Supabase for ${tableName}:`, supabaseError);
    return false;
  }
  
  // Get count from Cloud SQL
  try {
    const client = await cloudSqlPool.connect();
    try {
      const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      const cloudSqlCount = parseInt(result.rows[0].count);
      
      console.log(`${tableName}: Supabase count = ${supabaseCount}, Cloud SQL count = ${cloudSqlCount}`);
      
      if (supabaseCount !== cloudSqlCount) {
        console.error(`Count mismatch for table ${tableName}`);
        return false;
      }
      
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error getting count from Cloud SQL for ${tableName}:`, err);
    return false;
  }
}

async function verifyMigration() {
  console.log('Starting migration verification...');
  
  let allTablesVerified = true;
  
  for (const table of tables) {
    const verified = await verifyTable(table);
    if (!verified) {
      allTablesVerified = false;
      console.error(`Verification failed for table ${table}`);
    }
  }
  
  if (allTablesVerified) {
    console.log('All tables verified successfully');
    process.exit(0);
  } else {
    console.error('Verification failed for one or more tables');
    process.exit(1);
  }
}

verifyMigration().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
