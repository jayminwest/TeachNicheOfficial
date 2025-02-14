import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';

export async function POST() {
  return handleUpload();
}

export async function PUT() {
  return handleUpload();
}

async function handleUpload() {
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
    console.error('Video upload initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize video upload';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
