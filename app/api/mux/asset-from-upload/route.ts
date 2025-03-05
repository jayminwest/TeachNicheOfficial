import { NextResponse } from 'next/server';
import { getUploadStatus, getAssetIdFromUpload } from '@/app/services/mux';

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
    
    // Validate the upload ID format
    if (uploadId.startsWith('temp_') || uploadId.startsWith('dummy_') || uploadId.startsWith('local_')) {
      console.error(`API: Invalid upload ID format: ${uploadId}`);
      return NextResponse.json(
        { error: `Invalid upload ID: ${uploadId}. Temporary IDs should not be used.` },
        { status: 400 }
      );
    }
    
    try {
      // Log the exact request we're about to make to help debug
      console.log(`API: About to call Mux API with upload ID: ${uploadId}`);
      
      // First, check the upload status to see if it has an asset ID already
      console.log(`API: Checking upload status for ${uploadId}`);
      const uploadStatus = await getUploadStatus(uploadId);
      
      // Log the full response from getUploadStatus
      console.log(`API: Upload status response for ${uploadId}:`, JSON.stringify(uploadStatus, null, 2));
      
      if (uploadStatus.status === 'errored') {
        const errorDetails = uploadStatus.error ? JSON.stringify(uploadStatus.error) : 'Unknown error';
        console.error(`API: Upload ${uploadId} has errored: ${errorDetails}`);
        return NextResponse.json(
          { 
            error: 'Upload failed',
            details: errorDetails,
            uploadStatus: uploadStatus
          },
          { status: 500 }
        );
      }
      
      // If the upload has already created an asset, use that asset ID
      if (uploadStatus.status === 'asset_created' && uploadStatus.assetId) {
        console.log(`API: Upload ${uploadId} already has asset ID ${uploadStatus.assetId}`);
        return NextResponse.json({ assetId: uploadStatus.assetId });
      }
      
      // If we don't have an asset ID yet, try to get it
      console.log(`API: Getting asset ID from upload ${uploadId}`);
      const assetId = await getAssetIdFromUpload(uploadId);
      
      // Log the asset ID we received
      console.log(`API: Received asset ID from Mux: ${assetId}`);
      
      // Validate that we got a real asset ID
      if (!assetId) {
        console.error(`API: No asset ID returned for upload ${uploadId}`);
        throw new Error('No asset ID returned from Mux');
      }
      
      if (assetId.startsWith('temp_') || assetId.startsWith('dummy_') || assetId.startsWith('local_')) {
        console.error(`API: Invalid asset ID format returned: ${assetId}`);
        throw new Error(`Invalid asset ID returned: ${assetId}`);
      }
      
      console.log(`API: Found asset ID ${assetId} for upload ${uploadId}`);
      return NextResponse.json({ assetId });
    } catch (error) {
      // Log the full error details
      console.error(`API: Error getting asset ID for upload ${uploadId}:`, 
        error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      );
      
      // Return the error with more details
      return NextResponse.json(
        { 
          error: 'Failed to get asset ID from upload',
          details: error instanceof Error ? error.message : String(error),
          uploadId: uploadId
        },
        { status: 500 }
      );
    }
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
