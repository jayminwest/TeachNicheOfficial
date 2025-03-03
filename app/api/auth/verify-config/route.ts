import { NextResponse } from 'next/server';
import { verifyGoogleAuthConfig } from '@/app/lib/auth-config';

export async function GET() {
  try {
    const config = await verifyGoogleAuthConfig();
    
    return NextResponse.json({
      success: true,
      config
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
