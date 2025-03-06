import { NextResponse } from 'next/server';
import { createUpload } from '@/app/services/mux';

export async function POST(request: Request) {
  try {
    // Get the isFree parameter from the request body
    const body = await request.json().catch(() => ({}));
    const isFree = body.isFree === true;
    
    console.log(`Creating upload with isFree=${isFree}`);
    const upload = await createUpload(isFree);
    
    return NextResponse.json({
      url: upload.url,
      uploadId: upload.uploadId
    });
  } catch (error) {
    console.error('Error creating upload:', error);
    return NextResponse.json(
      { error: 'Failed to create upload', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
