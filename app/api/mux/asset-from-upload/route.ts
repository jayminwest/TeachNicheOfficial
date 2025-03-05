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
    
    try {
      // First try to get the asset ID from the upload
      const assetId = await getAssetIdFromUpload(uploadId);
      console.log(`API: Found asset ID ${assetId} for upload ${uploadId}`);
      return NextResponse.json({ assetId });
    } catch (error) {
      console.error(`API: Error getting asset ID for upload ${uploadId}:`, error);
      
      // If that fails, try to get the upload status
      try {
        const uploadStatus = await getUploadStatus(uploadId);
        
        if (uploadStatus.status === 'asset_created' && uploadStatus.assetId) {
          console.log(`API: Found asset ID ${uploadStatus.assetId} from upload status`);
          return NextResponse.json({ assetId: uploadStatus.assetId });
        }
        
        // If the upload is still waiting, return a temporary asset ID
        if (uploadStatus.status === 'waiting') {
          const tempAssetId = `temp_${uploadId}`;
          console.log(`API: Upload still waiting, returning temporary asset ID ${tempAssetId}`);
          return NextResponse.json({ assetId: tempAssetId });
        }
        
        // If the upload has errored, return an error
        if (uploadStatus.status === 'errored') {
          throw new Error('Upload failed: ' + (uploadStatus.error?.message || 'Unknown error'));
        }
      } catch (statusError) {
        console.error(`API: Error getting upload status for ${uploadId}:`, statusError);
      }
      
      // If all else fails, return a temporary asset ID based on the upload ID
      const fallbackAssetId = `temp_${uploadId}`;
      console.log(`API: Using fallback asset ID ${fallbackAssetId}`);
      return NextResponse.json({ assetId: fallbackAssetId });
    }
  } catch (error) {
    console.error('API: Error in asset-from-upload route:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get asset ID',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
