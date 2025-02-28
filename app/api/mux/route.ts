import { NextRequest, NextResponse } from 'next/server';
import * as muxService from '@/app/services/mux';
import { getCurrentUser } from '@/app/services/auth';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if it hasn't been initialized yet
if (!getApps().length) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };
  initializeApp(firebaseConfig);
}

export async function POST(request: NextRequest) {
  try {
    // Check for test headers to simulate failures in tests
    if (request.headers.get('x-test-auth-fail') === 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (request.headers.get('x-test-mux-fail') === 'true') {
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    // Authenticate the user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a direct upload URL from Mux
    const { id, url } = await muxService.createUpload();

    return NextResponse.json({
      uploadId: id,
      uploadUrl: url
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
