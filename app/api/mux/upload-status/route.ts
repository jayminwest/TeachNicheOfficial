import { NextResponse } from 'next/server';
import { getUploadStatus } from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID required' },
        { status: 400 }
      );
    }

    const status = await getUploadStatus(uploadId);
    
    if (status.error) {
      return NextResponse.json(
        { error: status.error },
        { status: 500 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get upload status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
