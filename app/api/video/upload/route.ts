import { NextResponse } from 'next/server';
import { createUpload } from '@/lib/mux';

export async function POST() {
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
