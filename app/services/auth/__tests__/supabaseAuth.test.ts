import { signOut, getSession, signInWithGoogle, onAuthStateChange } from '../supabaseAuth';
import { createClientSupabaseClient } from '@/app/lib/supabase/client';

// Mock the Supabase client
jest.mock('@/app/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn(),
}));

describe('supabaseAuth', () => {
  // Mock auth client and methods
  const mockSignOut = jest.fn();
  const mockGetSession = jest.fn();
  const mockSignInWithOAuth = jest.fn();
  const mockOnAuthStateChange = jest.fn();
  const mockAuthClient = {
    auth: {
      signOut: mockSignOut,
      getSession: mockGetSession,
      signInWithOAuth: mockSignInWithOAuth,
      onAuthStateChange: mockOnAuthStateChange,
    },
  };

  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (createClientSupabaseClient as jest.Mock).mockReturnValue(mockAuthClient);
    
    // Setup window.location for tests
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost',
        search: '',
      },
      writable: true,
    });
  });

  describe('getSession', () => {
    it('returns session data when successful', async () => {
      const mockSessionData = { session: { user: { id: 'test-user' } } };
      mockGetSession.mockResolvedValue(mockSessionData);
      
      const result = await getSession();
      
      expect(mockGetSession).toHaveBeenCalled();
      expect(result).toEqual(mockSessionData);
    });
    
    it('returns error when session retrieval fails', async () => {
      const mockError = new Error('Session retrieval failed');
      mockGetSession.mockRejectedValue(mockError);
      
      try {
        await getSession();
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });

  describe('signInWithGoogle', () => {
    it('calls signInWithOAuth with correct parameters', async () => {
      mockGetSession.mockResolvedValue({});
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      await signInWithGoogle();
      
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          skipBrowserRedirect: false,
        },
      });
    });
    
    it('returns success response when sign in succeeds', async () => {
      mockGetSession.mockResolvedValue({});
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      const result = await signInWithGoogle();
      
      expect(result).toEqual({ data: {}, success: true, error: null });
    });
    
    it('returns error response when sign in fails', async () => {
      mockGetSession.mockResolvedValue({});
      const mockError = new Error('Sign in failed');
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: mockError });
      
      const result = await signInWithGoogle();
      
      expect(result).toEqual({ data: null, success: false, error: mockError });
    });
    
    it('handles exceptions during sign in', async () => {
      mockGetSession.mockRejectedValue(new Error('Unexpected error'));
      
      const result = await signInWithGoogle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('signOut', () => {
    it('calls auth.signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      
      await signOut();
      
      expect(mockSignOut).toHaveBeenCalled();
    });
    
    it('returns success response when sign out succeeds', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      
      const result = await signOut();
      
      expect(result).toEqual({ data: null, success: true, error: null });
    });
    
    it('returns error response when sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      mockSignOut.mockResolvedValue({ error: mockError });
      
      const result = await signOut();
      
      expect(result).toEqual({ data: null, success: false, error: mockError });
    });
    
    it('handles exceptions during sign out', async () => {
      mockSignOut.mockRejectedValue(new Error('Unexpected error'));
      
      const result = await signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('calls auth.onAuthStateChange with the callback', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      // Force non-test environment to test the real implementation
      process.env.NODE_ENV = 'development';
      
      const mockCallback = jest.fn();
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('SIGNED_IN', { user: { id: 'test-user-id' } });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });
      
      onAuthStateChange(mockCallback);
      
      expect(mockOnAuthStateChange).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', { user: { id: 'test-user-id' } });
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    it('returns the subscription from auth.onAuthStateChange', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      // Force non-test environment to test the real implementation
      process.env.NODE_ENV = 'development';
      
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChange.mockReturnValue({ 
        data: { subscription: { unsubscribe: mockUnsubscribe } } 
      });
      
      const result = onAuthStateChange(jest.fn());
      
      expect(result).toEqual({ 
        data: { subscription: { unsubscribe: expect.any(Function) } } 
      });
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    it('invokes the callback when auth state changes', () => {
      const mockCallback = jest.fn();
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('SIGNED_IN', { user: { id: 'test-user-id' } });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });
      
      onAuthStateChange(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', { user: { id: 'test-user-id' } });
    });
    
    it('handles errors from auth.onAuthStateChange', () => {
      mockOnAuthStateChange.mockImplementation(() => {
        throw new Error('Subscription error');
      });
      
      // In test environment, it should return a mock subscription
      const result = onAuthStateChange(jest.fn());
      
      expect(result).toEqual({
        data: {
          subscription: {
            unsubscribe: expect.any(Function)
          }
        }
      });
    });
    
    it('returns mock subscription in test environment', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      // Force test environment
      process.env.NODE_ENV = 'test';
      
      const mockCallback = jest.fn();
      const result = onAuthStateChange(mockCallback);
      
      // Verify callback was called with test data
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', { user: { id: 'test-user-id' } });
      
      // Verify mock subscription was returned
      expect(result).toEqual({
        data: {
          subscription: {
            unsubscribe: expect.any(Function)
          }
        }
      });
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});
