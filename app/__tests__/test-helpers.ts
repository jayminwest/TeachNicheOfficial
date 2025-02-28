/**
 * Test helpers for TypeScript type issues
 */

/**
 * Helper to convert mock requests to the Request type expected by route handlers
 * Fixes TS2345 errors in test files
 */
export function asRequest(mockRequest: any): Request {
  return mockRequest as unknown as Request;
}

/**
 * Helper to check if an object has the expected Firebase user metadata structure
 * Fixes TS2339 errors for custom metadata properties
 */
import { UserMetadata } from 'firebase/auth';

export interface ExtendedUserMetadata extends UserMetadata {
  creatorProfile?: boolean;
  is_creator?: boolean;
}

export function hasCreatorProfile(metadata: UserMetadata | undefined): boolean {
  if (!metadata) return false;
  return !!(
    (metadata as ExtendedUserMetadata).creatorProfile || 
    (metadata as ExtendedUserMetadata).is_creator
  );
}

/**
 * Type guard for objects with data.session structure
 * Fixes TS18046 errors for unknown types
 */
export function hasDataSession(obj: unknown): obj is { data: { session: any } } {
  return obj !== null && 
         typeof obj === 'object' && 
         'data' in obj && 
         obj.data !== null &&
         typeof obj.data === 'object' &&
         'session' in obj.data;
}
