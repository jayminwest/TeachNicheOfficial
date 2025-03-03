/**
 * This file is kept for backward compatibility but all auth functionality
 * has been consolidated in the supabaseAuth.ts file
 */

export { signInWithGoogle } from '@/app/services/auth/supabaseAuth';

/**
 * Verifies the Google Auth configuration
 */
export async function verifyGoogleAuthConfig() {
  const redirectUri = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback` 
    : null;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || null;
  
  return {
    redirectUri,
    baseUrl,
    isConfigured: Boolean(redirectUri && baseUrl)
  };
}
