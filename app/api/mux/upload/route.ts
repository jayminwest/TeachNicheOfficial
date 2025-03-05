import { NextResponse } from 'next/server';
import { createUpload } from '@/app/services/mux';

export async function POST() {
  try {
    // Get the isFree parameter from the query string if needed
    const isFree = false; // Default to false, can be made dynamic if needed
    
    const upload = await createUpload(isFree);
    
    return NextResponse.json({
      url: upload.url,
      uploadId: upload.id
    });
  } catch (error) {
    console.error('Error creating upload:', error);
    return NextResponse.json(
      { error: 'Failed to create upload', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
