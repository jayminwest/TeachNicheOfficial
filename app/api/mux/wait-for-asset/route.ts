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
    
    // Remove temporary ID handling - we should never have temporary IDs
    if (assetId.startsWith('temp_') || assetId.startsWith('dummy_') || assetId.startsWith('local_')) {
      return NextResponse.json(
        { error: `Invalid asset ID: ${assetId}. Temporary IDs should not be used.` },
        { status: 400 }
      );
    }
    
    try {
      // Wait for the asset to be ready
      const result = await waitForAssetReady(assetId);
      console.log(`API: Asset ${assetId} status: ${result.status}, playback ID: ${result.playbackId || 'none'}`);
      
      // Validate that we have a playback ID before returning success
      if (result.status === 'ready' && result.playbackId) {
        // Double check that the playback ID is not a temporary one
        if (result.playbackId.startsWith('temp_') || result.playbackId.startsWith('dummy_') || result.playbackId.startsWith('local_')) {
          console.error(`API: Invalid playback ID format returned: ${result.playbackId}`);
          throw new Error(`Invalid playback ID format: ${result.playbackId}`);
        }
        
        return NextResponse.json(result);
      } else {
        throw new Error(`Asset ${assetId} is ready but has no playback ID`);
      }
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
        // Return the error instead of a dummy status
        return NextResponse.json(
          { 
            error: 'Failed to get asset status',
            details: statusError instanceof Error ? statusError.message : String(statusError)
          },
          { status: 500 }
        );
      }
      
      // Return the original error instead of a dummy status
      return NextResponse.json(
        { 
          error: 'Failed to wait for asset',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
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
