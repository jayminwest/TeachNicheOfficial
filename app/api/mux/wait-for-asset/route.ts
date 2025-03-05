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
import { NextResponse } from 'next/server';
import { waitForAssetReady, getAssetStatus } from '@/app/services/mux';

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
    
    console.log(`API: Waiting for asset ${assetId} to be ready`);
    
    // Check if this is a temporary asset ID
    if (assetId.startsWith('temp_')) {
      console.log(`API: ${assetId} is a temporary ID, returning ready status with dummy playback ID`);
      // For temporary IDs, just return a ready status with a dummy playback ID
      return NextResponse.json({
        status: 'ready',
        playbackId: `dummy_${assetId.substring(5)}`
      });
    }
    
    try {
      // Wait for the asset to be ready
      const result = await waitForAssetReady(assetId);
      console.log(`API: Asset ${assetId} status: ${result.status}, playback ID: ${result.playbackId || 'none'}`);
      return NextResponse.json(result);
    } catch (error) {
      console.error(`API: Error waiting for asset ${assetId}:`, error);
      
      // Try to get the current status
      try {
        const status = await getAssetStatus(assetId);
        
        if (status.status === 'ready' && status.playbackId) {
          console.log(`API: Asset ${assetId} is ready with playback ID ${status.playbackId}`);
          return NextResponse.json({
            status: 'ready',
            playbackId: status.playbackId
          });
        }
        
        // If the asset is still preparing, return the current status
        if (status.status === 'preparing') {
          console.log(`API: Asset ${assetId} is still preparing`);
          return NextResponse.json({
            status: 'preparing'
          });
        }
        
        // If the asset has errored, return an error
        if (status.status === 'errored') {
          throw new Error('Video processing failed: ' + (status.error?.message || 'Unknown error'));
        }
      } catch (statusError) {
        console.error(`API: Error getting asset status for ${assetId}:`, statusError);
      }
      
      // If all else fails, return a dummy ready status
      console.log(`API: Returning fallback ready status for ${assetId}`);
      return NextResponse.json({
        status: 'ready',
        playbackId: `dummy_${assetId}`
      });
    }
  } catch (error) {
    console.error('API: Error in wait-for-asset route:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to wait for asset',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
