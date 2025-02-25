import { NextRequest, NextResponse } from 'next/server';
import * as muxService from '@/app/services/mux';
import { getCurrentUser } from '@/app/services/auth';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  try {
    // Check for test headers
    const authFailHeader = request.headers.get('x-test-auth-fail');
    const muxFailHeader = request.headers.get('x-test-mux-fail');

    // Authenticate the user
    const user = await getCurrentUser(
      authFailHeader === 'true' ? { shouldSucceed: false } : undefined
    );
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a direct upload URL from Mux
    const { id, url } = await muxService.createUpload(
      muxFailHeader === 'true' ? { shouldSucceed: false } : undefined
    );

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
