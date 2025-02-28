/**
 * Auth Service Types
 * 
 * This file defines the types for authentication services.
 */

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
    creatorProfile?: boolean;
    is_creator?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
