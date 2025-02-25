import { NextResponse } from 'next/server';
import Mux from "@mux/mux-node";

// Initialize Mux client with environment variables
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
});
const { video } = muxClient;

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

    console.log('Checking upload status for:', uploadId);
    
    // Get the upload status
    const upload = await video.uploads.retrieve(uploadId);
    
    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    console.log('Upload status response:', {
      id: upload.id,
      status: upload.status,
      assetId: upload.asset_id
    });

    return NextResponse.json({
      id: upload.id,
      status: upload.status,
      assetId: upload.asset_id
    });

  } catch (error) {
    console.error('Error checking upload status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check upload status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
