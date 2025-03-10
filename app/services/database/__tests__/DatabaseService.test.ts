import { DatabaseService, DatabaseResponse } from '../DatabaseService';
import { PostgrestError } from '@supabase/supabase-js';

// Mock the Supabase client
jest.mock('@/app/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      execute: jest.fn()
    })
  })
}));

// Create a test implementation of DatabaseService for testing
class TestDatabaseService extends DatabaseService {
  // Expose protected methods for testing
  public async testExecuteWithRetry<T>(
    operation: () => Promise<{ data: T | null, error: PostgrestError | null }>,
    retries = 3
  ): Promise<DatabaseResponse<T>> {
    return this.executeWithRetry(operation as any, { maxRetries: retries });
  }

  public testGetClient() {
    return this.getClient();
  }
}

describe('DatabaseService', () => {
  let service: TestDatabaseService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new TestDatabaseService();
  });

  describe('getClient', () => {
    it('should return a Supabase client', () => {
      const client = service.testGetClient();
      expect(client).toBeDefined();
    });
  });

  describe('executeWithRetry', () => {
    it('should return success response when operation succeeds', async () => {
      const mockOperation = jest.fn().mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await service.testExecuteWithRetry(mockOperation);
      
      expect(result).toEqual({
        data: { id: '123' },
        error: null,
        success: true
      });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should return error response when operation fails with permission error', async () => {
      const mockError: PostgrestError = {
        message: 'Permission denied',
        details: '',
        hint: '',
        code: 'PGRST301'
      };
      
      const mockOperation = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await service.testExecuteWithRetry(mockOperation);
      
      expect(result).toEqual({
        data: null,
        error: new Error('Permission denied'),
        success: false
      });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should return error response when operation fails with invalid input error', async () => {
      const mockError: PostgrestError = {
        message: 'Invalid input',
        details: '',
        hint: '',
        code: 'PGRST302'
      };
      
      const mockOperation = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await service.testExecuteWithRetry(mockOperation);
      
      expect(result).toEqual({
        data: null,
        error: new Error('Invalid input'),
        success: false
      });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should return error response when operation fails with duplicate key error', async () => {
      const mockError: PostgrestError = {
        message: 'Duplicate key value',
        details: '',
        hint: '',
        code: '23505'
      };
      
      const mockOperation = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await service.testExecuteWithRetry(mockOperation);
      
      expect(result).toEqual({
        data: null,
        error: new Error('Duplicate key value'),
        success: false
      });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry operation on connection errors', async () => {
      const mockError: PostgrestError = {
        message: 'Connection error',
        details: '',
        hint: '',
        code: 'PGRST000' // Some other error code
      };
      
      // First call fails, second succeeds
      const mockOperation = jest.fn()
        .mockResolvedValueOnce({
          data: null,
          error: mockError
        })
        .mockResolvedValueOnce({
          data: { id: '123' },
          error: null
        });

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => {
        cb();
        return {} as NodeJS.Timeout;
      });

      const result = await service.testExecuteWithRetry(mockOperation);
      
      expect(result).toEqual({
        data: { id: '123' },
        error: null,
        success: true
      });
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should return error after maximum retries', async () => {
      const mockError: PostgrestError = {
        message: 'Connection error',
        details: '',
        hint: '',
        code: 'PGRST000' // Some other error code
      };
      
      // All calls fail
      const mockOperation = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => {
        cb();
        return {} as NodeJS.Timeout;
      });

      const result = await service.testExecuteWithRetry(mockOperation, 2);
      
      expect(result).toEqual({
        data: null,
        error: new Error('Connection error'),
        success: false
      });
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle unexpected exceptions', async () => {
      // Disable retries by mocking setTimeout to prevent additional calls
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        if (typeof cb === 'function') cb();
        return {} as NodeJS.Timeout;
      });
      
      const mockOperation = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.testExecuteWithRetry(mockOperation);
      
      expect(result).toEqual({
        data: null,
        error: new Error('Unexpected error'),
        success: false
      });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      // Disable retries by mocking setTimeout to prevent additional calls
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        if (typeof cb === 'function') cb();
        return {} as NodeJS.Timeout;
      });
      
      const mockOperation = jest.fn().mockImplementation(() => {
        throw 'String error'; // Non-Error exception
      });

      const result = await service.testExecuteWithRetry(mockOperation);
      
      expect(result).toEqual({
        data: null,
        error: new Error('String error'),
        success: false
      });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });
});
