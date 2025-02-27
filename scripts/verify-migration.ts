import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cloud SQL connection
const cloudSqlConfig = {
  user: process.env.CLOUD_SQL_USER || 'postgres',
  password: process.env.CLOUD_SQL_PASSWORD,
  database: process.env.CLOUD_SQL_DATABASE || 'teach_niche_db',
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

// Tables to verify - get these from the schema file
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

// Check if tables exist in the database
async function checkTablesExist() {
  try {
    const client = await cloudSqlPool.connect();
    try {
      console.log('Checking if tables exist in the database...');
      
      for (const table of tables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        const exists = result.rows[0].exists;
        console.log(`  Table ${table}: ${exists ? '✅ Exists' : '❌ Missing'}`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking tables:', error);
    throw error;
  }
}

// This function is removed as we're focusing on GCP only

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
  
  const cloudSqlCount = await getCloudSqlCount(table);
  
  if (cloudSqlCount === -1) {
    console.error(`Verification failed for table ${table}`);
    return false;
  }
  
  console.log(`  Cloud SQL count: ${cloudSqlCount}`);
  console.log(`  ✅ Table exists and has ${cloudSqlCount} records`);
  return true;
}

async function verifyMigration() {
  console.log('Starting migration verification...');
  
  try {
    // Test connection to Cloud SQL
    const client = await cloudSqlPool.connect();
    console.log('✅ Successfully connected to database');
    client.release();
    
    // Check if tables exist
    await checkTablesExist();
    
    let allTablesVerified = true;
    
    // Verify table data counts
    console.log('\nVerifying database tables...');
    for (const table of tables) {
      const isVerified = await verifyTable(table);
      if (!isVerified) {
        allTablesVerified = false;
      }
    }
    
    if (allTablesVerified) {
      console.log('\n✅ All tables verified successfully!');
    } else {
      console.log('\n❌ Verification failed for one or more tables');
    }
    
    console.log('\nDatabase verification complete!');
    console.log('You can now proceed with the next steps of the GCP migration.');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.error('Please make sure the database is created and accessible.');
    console.error('You can set up a local PostgreSQL database with:');
    console.error('  bash scripts/setup-local-postgres.sh');
    console.error('  bash scripts/init-database.sh');
    process.exit(1);
  } finally {
    // Close connections
    await cloudSqlPool.end();
  }
}

verifyMigration().catch(error => {
  console.error('Migration verification failed:', error);
  process.exit(1);
});
