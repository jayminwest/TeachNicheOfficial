import { NextResponse } from 'next/server';
import { getUploadStatus, MuxUploadStatusResponse } from '@/app/services/mux/index';

export async function GET(request: Request) {
  try {
    // Get the upload ID from the query parameters
    const url = new URL(request.url);
    const uploadId = url.searchParams.get('uploadId');
    
    if (!uploadId) {
      console.error('API: Missing uploadId parameter');
      return NextResponse.json(
        { error: 'Missing uploadId parameter' },
        { status: 400 }
      );
    }
    
    console.log(`API: Getting asset ID for upload ${uploadId}`);
    
    // Handle temporary IDs with a clear error instead of fallbacks
    if (uploadId.startsWith('temp_') || uploadId.startsWith('dummy_') || uploadId.startsWith('local_')) {
      console.error(`API: Received temporary upload ID: ${uploadId}. This is not a valid Mux upload ID.`);
      return NextResponse.json(
        { 
          error: 'Invalid upload ID format', 
          details: 'Temporary IDs cannot be used to retrieve assets from Mux'
        },
        { status: 400 }
      );
    }
    
    // Use the typed function from the comprehensive Mux service
    const uploadStatus: MuxUploadStatusResponse = await getUploadStatus(uploadId);
    
    // Log the response for debugging
    console.log(`API: Upload status response:`, JSON.stringify(uploadStatus, null, 2));
    
    if (uploadStatus.error) {
      return NextResponse.json(
        { 
          error: 'Failed to get upload status from Mux', 
          details: uploadStatus.error
        },
        { status: 500 }
      );
    }
    
    if (uploadStatus.assetId) {
      console.log(`API: Upload ${uploadId} has asset ID ${uploadStatus.assetId}`);
      return NextResponse.json({ assetId: uploadStatus.assetId });
    }
    
    // If the upload is still processing, return a 202 status
    return NextResponse.json(
      { 
        message: `Upload has status ${uploadStatus.status} but no asset ID yet`,
        status: uploadStatus.status
      },
      { status: 202 }
    );
  } catch (error) {
    // Log the full error details
    console.error('API: Error in asset-from-upload route:', 
      error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    );
    
    // Return the error with more details
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
