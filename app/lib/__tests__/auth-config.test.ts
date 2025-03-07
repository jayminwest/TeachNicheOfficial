import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { signInWithGoogle, verifyGoogleAuthConfig } from '../auth-config';
import * as supabaseAuth from '@/app/services/auth/supabaseAuth';

// Mock the supabaseAuth module
jest.mock('@/app/services/auth/supabaseAuth');

describe('Auth Config', () => {
  describe('signInWithGoogle', () => {
    it('calls the signInWithGoogle function from supabaseAuth', async () => {
      // Setup
      const mockAuthResponse = { data: { user: { id: 'test-user' } }, error: null };
      jest.spyOn(supabaseAuth, 'signInWithGoogle').mockResolvedValue(mockAuthResponse);
      
      // Execute
      const result = await signInWithGoogle();
      
      // Verify
      expect(supabaseAuth.signInWithGoogle).toHaveBeenCalled();
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('verifyGoogleAuthConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Save original env vars and reset for each test
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore original env vars
      process.env = originalEnv;
    });

    it('returns configured=false when env vars are missing', async () => {
      // Setup - ensure env vars are undefined
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_BASE_URL;
      
      // Execute
      const result = await verifyGoogleAuthConfig();
      
      // Verify
      expect(result).toEqual({
        redirectUri: null,
        baseUrl: null,
        isConfigured: false
      });
    });

    it('returns configured=true when all env vars are present', async () => {
      // Setup
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase.com';
      process.env.NEXT_PUBLIC_BASE_URL = 'https://test-app.com';
      
      // Execute
      const result = await verifyGoogleAuthConfig();
      
      // Verify
      expect(result).toEqual({
        redirectUri: 'https://test-supabase.com/auth/v1/callback',
        baseUrl: 'https://test-app.com',
        isConfigured: true
      });
    });

    it('returns configured=false when only supabase URL is present', async () => {
      // Setup
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase.com';
      delete process.env.NEXT_PUBLIC_BASE_URL;
      
      // Execute
      const result = await verifyGoogleAuthConfig();
      
      // Verify
      expect(result).toEqual({
        redirectUri: 'https://test-supabase.com/auth/v1/callback',
        baseUrl: null,
        isConfigured: false
      });
    });

    it('returns configured=false when only base URL is present', async () => {
      // Setup
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_BASE_URL = 'https://test-app.com';
      
      // Execute
      const result = await verifyGoogleAuthConfig();
      
      // Verify
      expect(result).toEqual({
        redirectUri: null,
        baseUrl: 'https://test-app.com',
        isConfigured: false
      });
    });
  });
});
