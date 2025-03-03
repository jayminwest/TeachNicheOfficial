import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

/**
 * Helper function to get the correct redirect URL for Google OAuth
 * This ensures the redirect URL matches what's configured in Google Cloud Console
 */
export const getGoogleAuthRedirectUrl = () => {
  // For Google OAuth, we need to use the exact URL that's registered in Google Cloud Console
  // This should match exactly what's in the authorized redirect URIs
  return 'https://erhavrzwpyvnpefifsfu.supabase.co/auth/v1/callback';
};

/**
 * Initialize Google Auth with the correct redirect URL
 * This can be used to verify the configuration is correct
 */
export const verifyGoogleAuthConfig = async () => {
  try {
    const redirectUrl = getGoogleAuthRedirectUrl();
    console.log('Google Auth redirect URL:', redirectUrl);
    
    // Log the Supabase URL for comparison
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    return {
      success: true,
      redirectUrl,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    };
  } catch (error) {
    console.error('Failed to verify Google Auth config:', error);
    return { success: false, error };
  }
};

/**
 * Sign in with Google using the correct redirect URL
 */
export const signInWithGoogleAuth = async () => {
  const supabase = createClientComponentClient<Database>();
  const redirectUrl = getGoogleAuthRedirectUrl();
  
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    }
  });
};
