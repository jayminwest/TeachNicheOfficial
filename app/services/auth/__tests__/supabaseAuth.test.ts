import { getSession, signInWithGoogle, signOut, onAuthStateChange } from '../supabaseAuth';
import { createClientSupabaseClient } from '@/app/lib/supabase/client';

// Mock the Supabase client
jest.mock('@/app/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn(),
}));

describe('supabaseAuth', () => {
  let mockSupabaseClient: {
    auth: {
      signInWithOAuth: jest.Mock;
      signOut: jest.Mock;
      getSession: jest.Mock;
      onAuthStateChange: jest.Mock;
    };
  };
  let mockAuthClient: {
    signInWithOAuth: jest.Mock;
    signOut: jest.Mock;
    getSession: jest.Mock;
    onAuthStateChange: jest.Mock;
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock auth client
    mockAuthClient = {
      signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } }, error: null }),
    };
    
    // Set up mock Supabase client
    mockSupabaseClient = {
      auth: mockAuthClient,
    };
    
    // Mock the createClientSupabaseClient function
    (createClientSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });
  
  describe('getSession', () => {
    it('returns session data when successful', async () => {
      const mockSession = { user: { id: 'test-user-id' } };
      mockAuthClient.getSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      });
      
      const result = await getSession();
      
      expect(result).toEqual({ data: { session: mockSession }, error: null });
      expect(mockAuthClient.getSession).toHaveBeenCalledTimes(1);
    });
    
    it('returns error when session retrieval fails', async () => {
      const mockError = new Error('Session retrieval failed');
      mockAuthClient.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: mockError 
      });
      
      const result = await getSession();
      
      expect(result).toEqual({ data: { session: null }, error: mockError });
    });
    
    it('handles exceptions during session retrieval', async () => {
      mockAuthClient.getSession.mockRejectedValue(new Error('Unexpected error'));
      
      const result = await getSession();
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unexpected error');
      expect(result.data).toEqual({ session: null });
    });
  });
  
  describe('signInWithGoogle', () => {
    it('calls signInWithOAuth with correct parameters', async () => {
      await signInWithGoogle();
      
      expect(mockAuthClient.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.any(String),
        },
      });
    });
    
    it('returns success response when sign in succeeds', async () => {
      mockAuthClient.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
      
      const result = await signInWithGoogle();
      
      expect(result).toEqual({ success: true, error: null });
    });
    
    it('returns error response when sign in fails', async () => {
      const mockError = new Error('Sign in failed');
      mockAuthClient.signInWithOAuth.mockResolvedValue({ data: {}, error: mockError });
      
      const result = await signInWithGoogle();
      
      expect(result).toEqual({ success: false, error: mockError });
    });
    
    it('handles exceptions during sign in', async () => {
      mockAuthClient.signInWithOAuth.mockRejectedValue(new Error('Unexpected error'));
      
      const result = await signInWithGoogle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unexpected error');
    });
  });
  
  describe('signOut', () => {
    it('calls auth.signOut', async () => {
      await signOut();
      
      expect(mockAuthClient.signOut).toHaveBeenCalledTimes(1);
    });
    
    it('returns success response when sign out succeeds', async () => {
      mockAuthClient.signOut.mockResolvedValue({ error: null });
      
      const result = await signOut();
      
      expect(result).toEqual({ success: true, error: null });
    });
    
    it('returns error response when sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      mockAuthClient.signOut.mockResolvedValue({ error: mockError });
      
      const result = await signOut();
      
      expect(result).toEqual({ success: false, error: mockError });
    });
    
    it('handles exceptions during sign out', async () => {
      mockAuthClient.signOut.mockRejectedValue(new Error('Unexpected error'));
      
      const result = await signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unexpected error');
    });
  });
  
  describe('onAuthStateChange', () => {
    it('calls auth.onAuthStateChange with the callback', () => {
      const mockCallback = jest.fn();
      
      onAuthStateChange(mockCallback);
      
      expect(mockAuthClient.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    });
    
    it('returns the subscription from auth.onAuthStateChange', () => {
      const mockUnsubscribe = jest.fn();
      mockAuthClient.onAuthStateChange.mockReturnValue({ 
        data: { subscription: { unsubscribe: mockUnsubscribe } },
        error: null
      });
      
      const result = onAuthStateChange(jest.fn());
      
      expect(result).toEqual({ 
        data: { subscription: { unsubscribe: mockUnsubscribe } },
        error: null
      });
    });
    
    it('invokes the callback when auth state changes', () => {
      const mockCallback = jest.fn();
      let capturedCallback: (event: string, session: unknown) => void;
      
      mockAuthClient.onAuthStateChange.mockImplementation((callback) => {
        capturedCallback = callback;
        return { 
          data: { subscription: { unsubscribe: jest.fn() } },
          error: null
        };
      });
      
      onAuthStateChange(mockCallback);
      
      // Simulate auth state change
      const mockEvent = 'SIGNED_IN';
      const mockSession = { user: { id: 'test-user-id' } };
      capturedCallback(mockEvent, mockSession);
      
      expect(mockCallback).toHaveBeenCalledWith(mockEvent, mockSession);
    });
    
    it('handles errors from auth.onAuthStateChange', () => {
      const mockError = new Error('Subscription error');
      mockAuthClient.onAuthStateChange.mockReturnValue({ 
        data: null,
        error: mockError
      });
      
      const result = onAuthStateChange(jest.fn());
      
      expect(result).toEqual({ 
        data: null,
        error: mockError
      });
    });
  });
});
