/**
 * Type definitions for Firebase Auth
 * This file provides type definitions for Firebase Auth to help with TypeScript errors
 */

export interface FirebaseUser {
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

export interface FirebaseAuth {
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
  signOut: () => Promise<void>;
  currentUser: FirebaseUser | null;
}

/**
 * Type guard to check if an object is a FirebaseUser
 */
export function isFirebaseUser(user: unknown): user is FirebaseUser {
  return (
    typeof user === 'object' && 
    user !== null && 
    'uid' in user && 
    typeof (user as FirebaseUser).uid === 'string'
  );
}

/**
 * Helper to convert unknown user to Record<string, unknown>
 */
export function userToRecord(user: unknown): Record<string, unknown> {
  if (!user || typeof user !== 'object') {
    return {};
  }
  
  // Convert user object to Record<string, unknown>
  return Object.entries(user as object).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, unknown>);
}

/**
 * Helper to safely access Firebase Auth
 */
export function getFirebaseAuth(): FirebaseAuth {
  if (typeof getAuth === 'function') {
    return getAuth() as unknown as FirebaseAuth;
  }
  throw new Error('Firebase Auth not available');
}
