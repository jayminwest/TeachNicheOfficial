import { NextResponse } from 'next/server';
import { getAssetIdFromUpload } from '@/app/services/mux';

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
    
    // Get the asset ID from the upload
    const assetId = await getAssetIdFromUpload(uploadId);
    
    return NextResponse.json({ assetId });
  } catch (error) {
    console.error('Error getting asset ID from upload:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get asset ID',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
