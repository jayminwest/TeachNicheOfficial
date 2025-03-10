import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/database';
import { DatabaseService, DatabaseResponse } from './databaseService';

/**
 * Server-side extension of DatabaseService
 * This class should only be used in Server Components
 */
export class ServerDatabaseService extends DatabaseService {
  /**
   * Get a server-side Supabase client
   * This method uses cookies() from next/headers which is only available in Server Components
   */
  protected getServerClient() {
    try {
      return createServerComponentClient<Database>({ cookies });
    } catch (error) {
      console.error('Error creating server client:', error);
      // Fall back to client component client
      return this.getClient();
    }
  }

  /**
   * Get the current client - for server components, we prefer the server client
   */
  protected getClient() {
    try {
      return this.getServerClient();
    } catch (error) {
      console.error('Error getting server client, falling back to client component client:', error);
      return createClientComponentClient<Database>();
    }
  }
}

// Create a singleton instance
export const serverDatabaseService = new ServerDatabaseService();
