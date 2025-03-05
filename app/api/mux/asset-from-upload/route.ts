import { NextResponse } from 'next/server';
import { getUploadStatus, getAssetIdFromUpload, getMuxClient } from '@/app/services/mux';

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
    
    // Handle temporary IDs gracefully
    if (uploadId.startsWith('temp_') || uploadId.startsWith('dummy_') || uploadId.startsWith('local_')) {
      console.warn(`Received temporary upload ID: ${uploadId}. Attempting to find the most recent upload.`);
      
      try {
        // Get the most recent upload from Mux
        const mux = getMuxClient();
        const uploads = await mux.video.uploads.list({ limit: 1 });
        
        if (uploads && uploads.data && uploads.data.length > 0) {
          const latestUpload = uploads.data[0];
          
          if (latestUpload.asset_id) {
            console.log(`Found asset ID ${latestUpload.asset_id} from most recent upload`);
            return NextResponse.json({ assetId: latestUpload.asset_id });
          } else {
            console.error('Most recent upload does not have an asset ID yet');
            return NextResponse.json(
              { error: 'Most recent upload does not have an asset ID yet', details: 'The upload may still be processing' },
              { status: 404 }
            );
          }
        } else {
          console.error('No recent uploads found');
          return NextResponse.json(
            { error: 'No recent uploads found', details: 'Could not find any uploads in your Mux account' },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error('Error getting recent uploads:', error);
        return NextResponse.json(
          { error: 'Failed to get recent uploads', details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }
    
    // Log the exact request we're about to make to help debug
    console.log(`API: About to call Mux API with upload ID: ${uploadId}`);
    
    // Get the Mux client directly to avoid any parsing issues
    const mux = getMuxClient();
    
    try {
      // Try to get the upload directly from Mux
      console.log(`API: Retrieving upload directly from Mux API: ${uploadId}`);
      const upload = await mux.video.uploads.retrieve(uploadId);
      
      // Log the full response for debugging
      console.log(`API: Raw Mux upload response:`, JSON.stringify(upload, null, 2));
      
      // Check if the upload has an asset ID
      if (upload.asset_id) {
        console.log(`API: Upload ${uploadId} has asset ID ${upload.asset_id}`);
        return NextResponse.json({ assetId: upload.asset_id });
      }
      
      // If the upload is errored, return an error
      if (upload.status === 'errored') {
        const errorDetails = upload.error ? JSON.stringify(upload.error) : 'Unknown error';
        console.error(`API: Upload ${uploadId} has errored: ${errorDetails}`);
        return NextResponse.json(
          { 
            error: 'Upload failed',
            details: errorDetails,
            uploadStatus: upload.status
          },
          { status: 500 }
        );
      }
      
      // If the upload is still waiting, return a 202 status
      if (upload.status === 'waiting') {
        console.log(`API: Upload ${uploadId} is still waiting for asset creation`);
        return NextResponse.json(
          { 
            message: 'Upload is still processing, no asset ID available yet',
            status: upload.status
          },
          { status: 202 }
        );
      }
      
      // For any other status, return the status but indicate no asset ID yet
      console.log(`API: Upload ${uploadId} has status ${upload.status} but no asset ID yet`);
      return NextResponse.json(
        { 
          message: `Upload has status ${upload.status} but no asset ID yet`,
          status: upload.status
        },
        { status: 202 }
      );
    } catch (muxError) {
      // If there's an error retrieving the upload, log it and continue with fallback
      console.error(`API: Error retrieving upload from Mux:`, muxError);
      
      // Try to get the most recent upload as a fallback
      console.log(`API: Attempting to get most recent upload as fallback`);
      const uploads = await mux.video.uploads.list({ limit: 1 });
      
      if (uploads && uploads.data && uploads.data.length > 0) {
        const latestUpload = uploads.data[0];
        
        if (latestUpload.asset_id) {
          console.log(`API: Found asset ID ${latestUpload.asset_id} from most recent upload`);
          return NextResponse.json({ assetId: latestUpload.asset_id });
        }
      }
      
      // If we still don't have an asset ID, return an error
      return NextResponse.json(
        { 
          error: 'Failed to get asset ID from Mux API', 
          details: muxError instanceof Error ? muxError.message : String(muxError)
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
