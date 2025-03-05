import { NextResponse } from 'next/server';
import { getUploadStatus, getAssetIdFromUpload } from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    // Get the upload ID from the query parameters
    const url = new URL(request.url);
    const uploadId = url.searchParams.get('uploadId');
    
    if (!uploadId) {
      return NextResponse.json(
        { error: 'Missing uploadId parameter' },
        { status: 400 }
      );
    }
    
    console.log(`API: Getting asset ID for upload ${uploadId}`);
    
    // Remove temporary ID creation for long IDs
    // Instead, validate the upload ID format
    if (uploadId.startsWith('temp_') || uploadId.startsWith('dummy_') || uploadId.startsWith('local_')) {
      return NextResponse.json(
        { error: `Invalid upload ID: ${uploadId}. Temporary IDs should not be used.` },
        { status: 400 }
      );
    }
    
    try {
      // Get the asset ID from the upload
      const assetId = await getAssetIdFromUpload(uploadId);
      
      // Validate that we got a real asset ID
      if (!assetId || assetId.startsWith('temp_') || assetId.startsWith('dummy_') || assetId.startsWith('local_')) {
        throw new Error(`Invalid asset ID returned: ${assetId}`);
      }
      
      console.log(`API: Found asset ID ${assetId} for upload ${uploadId}`);
      return NextResponse.json({ assetId });
    } catch (error) {
      console.error(`API: Error getting asset ID for upload ${uploadId}:`, error);
      
      // Return the error instead of creating a temporary ID
      return NextResponse.json(
        { 
          error: 'Failed to get asset ID from upload',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error in asset-from-upload route:', error);
    
    // Return the error instead of creating a temporary ID
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
