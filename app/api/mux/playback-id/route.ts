import { NextResponse } from 'next/server';
import MuxService from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    const muxService = MuxService.getInstance();
    const Video = muxService.getClient()?.video;
    
    if (!Video || typeof Video.assets?.retrieve !== 'function') {
      return NextResponse.json(
        { error: 'Mux Video client not properly initialized' },
        { status: 500 }
      );
    }

    // Parse the URL and get the assetId parameter
    let assetId;
    
    // Use a more robust URL parsing approach
    const urlString = request.url;
    console.log('Processing URL:', urlString);
    
    // Extract assetId using regex - more reliable than URL parsing
    const assetIdMatch = urlString.match(/assetId=([^&]+)/);
    assetId = assetIdMatch ? decodeURIComponent(assetIdMatch[1]) : null;
    
    console.log('Extracted assetId:', assetId);

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID required' },
        { status: 400 }
      );
    }

    console.log('Retrieving asset for ID:', assetId);
    
    // Retrieve the asset from Mux
    const asset = await Video.assets.retrieve(assetId);
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    console.log('Asset retrieved, status:', asset.status);
    
    // Get the playback ID if it exists
    const playbackId = asset.playback_ids?.[0]?.id || null;

    // If we don't have a playback ID but the asset is ready, create one
    if (!playbackId && asset.status === 'ready') {
      console.log('Creating new playback ID for ready asset');
      try {
        const newPlaybackId = await Video.assets.createPlaybackId(assetId, {
          policy: 'public'
        });
        
        if (newPlaybackId && newPlaybackId.id) {
          console.log('Created new playback ID:', newPlaybackId.id);
          return NextResponse.json({ playbackId: newPlaybackId.id });
        }
      } catch (createError) {
        console.error('Error creating playback ID:', createError);
        return NextResponse.json(
          { 
            error: 'Failed to create playback ID',
            details: createError instanceof Error ? createError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    if (!playbackId) {
      // If asset is not ready, return appropriate status
      if (asset.status !== 'ready') {
        return NextResponse.json(
          { 
            error: 'Asset not ready for playback',
            status: asset.status,
            assetId: assetId
          },
          { status: 202 } // 202 Accepted - request accepted but processing not complete
        );
      }
      
      return NextResponse.json(
        { error: 'No playback ID found for this asset' },
        { status: 404 }
      );
    }

    return NextResponse.json({ playbackId });
  } catch (error) {
    console.error('Error retrieving playback ID:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve playback ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
