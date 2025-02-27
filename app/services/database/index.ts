import { DatabaseService } from './interface';
import { FirebaseDatabase } from './supabase';

// Factory function to create the appropriate database service
export function createDatabaseService(): DatabaseService {
  return new FirebaseDatabase();
}

// For backward compatibility
export const databaseService = createDatabaseService();

export type { DatabaseService };
