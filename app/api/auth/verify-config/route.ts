import { NextResponse } from 'next/server';
import { verifyGoogleAuthConfig } from '@/app/lib/auth-config';

export async function GET() {
  try {
    const config = await verifyGoogleAuthConfig();
    
    // Return both the configured redirect URL and what's in Google Cloud Console
    return NextResponse.json({
      success: true,
      config,
      googleCloudRedirectUri: 'https://erhavrzwpyvnpefifsfu.supabase.co/auth/v1/callback',
      note: 'Make sure these URLs match exactly in Google Cloud Console',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    });
  } catch (error) {
    console.error('Error verifying auth config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
