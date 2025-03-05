import { NextResponse } from 'next/server';
import { waitForAssetReady } from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    // Get the asset ID from the query parameters
    const url = new URL(request.url);
    const assetId = url.searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing assetId parameter' },
        { status: 400 }
      );
    }
    
    // Wait for the asset to be ready
    const result = await waitForAssetReady(assetId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error waiting for asset:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to wait for asset',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
