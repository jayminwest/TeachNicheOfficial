import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/app/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { sessionCookie } = await request.json();
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Session cookie is required' },
        { status: 400 }
      );
    }
    
    // Initialize Firebase Admin
    const adminAuth = getAuth(await initializeFirebaseAdmin());
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Return user data
    return NextResponse.json({
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      // Add any other user data you need
    });
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}
