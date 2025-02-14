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
    
    return NextResponse.json({
      uploadUrl: upload.url,
      assetId: upload.id
    });
  } catch (error) {
    console.error('Video upload initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize video upload' },
      { status: 500 }
    );
  }
}
