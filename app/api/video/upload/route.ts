import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';

// Helper function to handle both POST and PUT requests
async function handleUploadRequest() {
  try {
    const upload = await createUpload();
    
    if (!upload?.url || !upload?.id) {
      throw new Error('Invalid upload response from Mux');
    }

    return NextResponse.json({
      uploadUrl: upload.url,
      assetId: upload.id
    });
  } catch (error) {
    console.error('Video upload initialization error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize video upload. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return handleUploadRequest();
}

export async function PUT() {
  return handleUploadRequest();
}
