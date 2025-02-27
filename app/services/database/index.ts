import { SupabaseDatabase } from './supabase';
import { CloudSqlDatabase } from './cloud-sql';

// Use environment variable to determine which implementation to use
const USE_GCP = process.env.NEXT_PUBLIC_USE_GCP === 'true';

export const databaseService = USE_GCP 
  ? new CloudSqlDatabase()
  : new SupabaseDatabase();
import { DatabaseService } from './interface';
import { FirebaseDatabase } from './supabase';

// Factory function to create the appropriate database service
export function createDatabaseService(): DatabaseService {
  return new FirebaseDatabase();
}

export type { DatabaseService };
