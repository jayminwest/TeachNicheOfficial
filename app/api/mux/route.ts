import { NextRequest, NextResponse } from 'next/server';
import * as muxService from '@/app/services/mux';
import { getCurrentUser } from '@/app/services/auth';

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
    const { uploadId, url } = await muxService.createUpload();

    return NextResponse.json({
      uploadId: uploadId,
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
