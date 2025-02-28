import { UserMetadata } from 'firebase/auth';
import { Request } from 'next/dist/server/web/spec-extension/request';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

/**
 * Extended user metadata interface to handle custom properties
 */
export interface ExtendedUserMetadata extends UserMetadata {
  creatorProfile?: boolean;
  is_creator?: boolean;
  creationTime?: string;
}

/**
 * Helper function to convert mock requests to Request objects for API route handlers
 * This solves the common TS2345 error in tests where MockRequest is not assignable to Request
 */
export function asRequest(mockRequest: Record<string, unknown> | any): Request {
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

/**
 * Type for MockRequest used in tests
 */
export type MockRequest<T = any> = T & {
  [key: string]: any;
  _setParameter: (key: string, value?: string) => void;
  _addBody: (key: string, value?: any) => void;
};
