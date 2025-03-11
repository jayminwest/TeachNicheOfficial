import { jest } from '@jest/globals';

// Helper to create typed mock responses
export const createMockResponse = <T>(data: T | null = null, error: Error | null = null) => ({
  data,
  error
});

// Helper for pagination responses
export const createPaginatedResponse = <T>(
  data: T[],
  page = 1,
  perPage = 10,
  totalCount = data.length
) => ({
  data,
  count: totalCount,
  page,
  perPage,
  hasMore: page * perPage < totalCount
});

// Helper to create mock errors
export const createMockError = (
  message: string,
  code = 'mock_error',
  status = 400
): Error => {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).status = status;
  return error;
};

// Type for mock function configurations
export interface MockConfig {
  shouldSucceed?: boolean;
  errorMessage?: string;
  delay?: number;
}

// Helper to create async mock functions with configurable behavior
export const createAsyncMock = <T>(
  successData: T,
  { shouldSucceed = true, errorMessage = 'Mock error', delay = 0 }: MockConfig = {}
) => {
  return jest.fn().mockImplementation(() => 
    new Promise((resolve) => {
      setTimeout(() => {
        if (shouldSucceed) {
          resolve(createMockResponse(successData));
        } else {
          resolve(createMockResponse(null, createMockError(errorMessage)));
        }
      }, delay);
    })
  );
};

// Helper to reset multiple mock functions
export const resetMocks = (mockObject: Record<string, unknown>) => {
  Object.values(mockObject).forEach(value => {
    if (typeof value === 'function' && 'mockClear' in value) {
      (value as jest.Mock).mockClear();
    }
  });
};
