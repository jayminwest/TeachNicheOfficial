import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';

export async function POST(request: Request) {
  return handleUpload(request);
}

export async function PUT(request: Request) {
  return handleUpload(request);
}

async function handleUpload(request: Request) {
  try {
    console.log(`Handling ${request.method} request to /api/video/upload`);
    
    // Log headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request headers:', headers);

    const upload = await createUpload();
    
    if (!upload?.url || !upload?.id) {
      throw new Error('Invalid upload response from Mux');
    }
    
    const response = {
      uploadUrl: upload.url,
      assetId: upload.id
    };
    
    console.log('Successfully created upload:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Video upload initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize video upload';
    
    // Log the full error details
    console.error('Full error details:', {
      message: errorMessage,
      error: error
    });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
