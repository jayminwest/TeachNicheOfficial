import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';

export async function POST() {
  const upload = await createUpload();
  return NextResponse.json({
    uploadUrl: upload.url,
    assetId: upload.id
  });
}

export async function PUT() {
  try {
    const upload = await createUpload();
    return NextResponse.json({
      uploadUrl: upload.url,
      assetId: upload.id
    });
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
