import { DatabaseService } from './interface';
import { FirestoreDatabase } from './firebase-database';

// Factory function to create the appropriate database service
export function createDatabaseService(): DatabaseService {
  return new FirestoreDatabase();
}

// For backward compatibility
export const databaseService = createDatabaseService();

export type { DatabaseService };
