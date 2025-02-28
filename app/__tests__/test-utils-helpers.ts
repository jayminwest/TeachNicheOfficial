import { UserMetadata } from 'firebase/auth';

/**
 * Extended user metadata interface to handle custom properties
 */
export interface ExtendedUserMetadata extends UserMetadata {
  creatorProfile?: boolean;
  is_creator?: boolean;
}

/**
 * Helper function to convert mock requests to Request objects for API route handlers
 */
export function asRequest(mockRequest: Record<string, unknown>): Request {
  return mockRequest as unknown as Request;
}

/**
 * Type guard for session objects
 */
export function hasDataSession(obj: unknown): obj is { data: { session: unknown } } {
  return obj !== null && 
         typeof obj === 'object' && 
         'data' in obj && 
         obj.data !== null &&
         typeof obj.data === 'object' &&
         'session' in obj.data;
}
