import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const migrationPath = path.join(process.cwd(), 'migrations', 'enable_rls.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Running RLS migration...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('RLS migration completed successfully');
  } catch (error) {
    console.error('Error executing migration:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error);
