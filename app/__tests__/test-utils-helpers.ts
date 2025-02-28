import { UserMetadata } from 'firebase/auth';

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
export function asRequest(mockRequest: Record<string, unknown> | unknown): Request {
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
export type MockRequest<T = unknown> = T & {
  [key: string]: unknown;
  _setParameter: (key: string, value?: string) => void;
  _addBody: (key: string, value?: unknown) => void;
};

/**
 * Type for Firebase User with extended metadata
 */
export interface FirebaseUserWithMetadata {
  uid: string;
  email: string | null;
  metadata: ExtendedUserMetadata;
}

/**
 * Type assertion for jest mocked functions
 */
export interface MockedFunctionWithOptions<T extends (...args: unknown[]) => unknown> {
  lastCallOptions?: Record<string, unknown>;
  mockImplementation: jest.MockedFunction<T>['mockImplementation'];
  mockReturnValue: jest.MockedFunction<T>['mockReturnValue'];
  mockResolvedValue: jest.MockedFunction<T>['mockResolvedValue'];
  mockRejectedValue: jest.MockedFunction<T>['mockRejectedValue'];
  mockClear: jest.MockedFunction<T>['mockClear'];
  mockReset: jest.MockedFunction<T>['mockReset'];
  mockRestore: jest.MockedFunction<T>['mockRestore'];
  getMockName: jest.MockedFunction<T>['getMockName'];
  mock: jest.MockedFunction<T>['mock'];
  calls: jest.MockedFunction<T>['mock']['calls'];
  instances: jest.MockedFunction<T>['mock']['instances'];
  invocationCallOrder: jest.MockedFunction<T>['mock']['invocationCallOrder'];
  results: jest.MockedFunction<T>['mock']['results'];
}
