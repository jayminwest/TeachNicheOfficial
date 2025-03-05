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
    
    // If the upload ID is very long, it might be a direct upload URL or contain extra data
    // Let's create a temporary asset ID immediately for very long IDs
    if (uploadId.length > 100) {
      const tempAssetId = `temp_${Date.now()}`;
      console.log(`API: Upload ID is very long, using temporary asset ID ${tempAssetId}`);
      return NextResponse.json({ assetId: tempAssetId });
    }
    
    try {
      // First try to get the asset ID from the upload
      const assetId = await getAssetIdFromUpload(uploadId);
      console.log(`API: Found asset ID ${assetId} for upload ${uploadId}`);
      return NextResponse.json({ assetId });
    } catch (error) {
      console.error(`API: Error getting asset ID for upload ${uploadId}:`, error);
      
      // If all else fails, return a temporary asset ID based on the upload ID
      // Use a shorter version of the upload ID to avoid issues
      const shortId = uploadId.length > 20 ? uploadId.substring(0, 20) : uploadId;
      const fallbackAssetId = `temp_${shortId}`;
      console.log(`API: Using fallback asset ID ${fallbackAssetId}`);
      return NextResponse.json({ assetId: fallbackAssetId });
    }
  } catch (error) {
    console.error('API: Error in asset-from-upload route:', error);
    
    // Always return a valid response, even in case of errors
    const tempAssetId = `temp_${Date.now()}`;
    console.log(`API: Error occurred, using emergency temporary asset ID ${tempAssetId}`);
    
    return NextResponse.json({ 
      assetId: tempAssetId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
